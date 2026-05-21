import { resolve } from "node:path";
import type { Logger } from "pino";
import type { AppEnv } from "../config/env.js";
import type { PokemonProduct, ScrapeSummary, SearchFilterOptions } from "../domain/product.js";
import { buildPokemonSearchPayload } from "../providers/tcgplayer/payload.js";
import { normalizePokemonProduct } from "../providers/tcgplayer/normalize.js";
import { TcgplayerSearchClient } from "../providers/tcgplayer/searchClient.js";
import type { TcgplayerSearchResponse } from "../providers/tcgplayer/types.js";
import { RunWriter } from "../storage/runWriter.js";
import { createRunId } from "../utils/time.js";

export interface ScrapePokemonOptions {
  outDir: string;
  maxPages: number;
  pageSize: number;
  startPage: number;
  query: string;
  shippingCountry: string;
  delayMs: number;
  timeoutMs: number;
  retryAttempts: number;
  includeRaw: boolean;
  dryRun: boolean;
  partitionBySet: boolean;
  filters: SearchFilterOptions;
}

interface SetPartition {
  value: string;
  count: number;
}

export function buildScrapeOptions(
  env: AppEnv,
  overrides: Partial<ScrapePokemonOptions> = {}
): ScrapePokemonOptions {
  const requestedPageSize = overrides.pageSize ?? Math.min(24, env.TCGPLAYER_MAX_PAGE_SIZE);

  return {
    outDir: "data",
    maxPages: 1,
    startPage: 1,
    query: "",
    shippingCountry: env.TCGPLAYER_SHIPPING_COUNTRY,
    delayMs: env.TCGPLAYER_MIN_DELAY_MS,
    timeoutMs: env.TCGPLAYER_TIMEOUT_MS,
    retryAttempts: env.TCGPLAYER_RETRY_ATTEMPTS,
    includeRaw: true,
    dryRun: false,
    partitionBySet: false,
    filters: {},
    ...overrides,
    pageSize: Math.min(requestedPageSize, env.TCGPLAYER_MAX_PAGE_SIZE)
  };
}

function assertPositiveInt(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function hasExplicitSetFilter(filters: SearchFilterOptions): boolean {
  return Boolean(filters.setName?.length);
}

function getSetPartitions(response: TcgplayerSearchResponse): SetPartition[] {
  const setAggregation = response.results[0]?.aggregations.setName;

  if (!Array.isArray(setAggregation)) {
    return [];
  }

  return setAggregation
    .map((item): SetPartition | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const value = record.urlValue;
      const count = record.count;

      if (typeof value !== "string" || value.trim() === "" || typeof count !== "number") {
        return null;
      }

      return { value, count };
    })
    .filter((item): item is SetPartition => item !== null)
    .sort((a, b) => b.count - a.count);
}

export async function scrapePokemon(
  env: AppEnv,
  options: ScrapePokemonOptions,
  logger: Logger
): Promise<ScrapeSummary> {
  assertPositiveInt("maxPages", options.maxPages);
  assertPositiveInt("pageSize", options.pageSize);
  assertPositiveInt("startPage", options.startPage);

  const runId = createRunId();
  const scrapedAt = new Date().toISOString();
  const outDir = resolve(options.outDir);
  const writer = new RunWriter({
    outDir,
    runId,
    includeRaw: options.includeRaw
  });

  const firstOffset = (options.startPage - 1) * options.pageSize;
  const firstPayload = buildPokemonSearchPayload({
    from: firstOffset,
    size: options.pageSize,
    shippingCountry: options.shippingCountry,
    filters: options.filters
  });

  if (options.dryRun) {
    logger.info({ payload: firstPayload, query: options.query }, "Dry run complete; no network request was sent.");
    return {
      runId,
      scrapedAt,
      totalResults: 0,
      requestedPages: options.maxPages,
      pagesFetched: 0,
      productsWritten: 0,
      outputDirectory: outDir,
      csvPath: "",
      jsonPath: "",
      manifestPath: "",
      rawDirectory: null,
      warnings: ["Dry run only. No network request was sent and no files were written."]
    };
  }

  await writer.prepare();

  const client = new TcgplayerSearchClient({
    endpoint: env.TCGPLAYER_SEARCH_ENDPOINT,
    mpfev: env.TCGPLAYER_MPFEV,
    userAgent: env.TCGPLAYER_USER_AGENT,
    timeoutMs: options.timeoutMs,
    retryAttempts: options.retryAttempts,
    minDelayMs: options.delayMs
  });

  const products: PokemonProduct[] = [];
  const warnings: string[] = [];
  let totalResults = 0;
  let pagesFetched = 0;
  let rawPageNumber = 0;

  async function fetchPage(pageNumber: number, filters: SearchFilterOptions, label: string): Promise<boolean> {
    const from = (pageNumber - 1) * options.pageSize;
    const payload = buildPokemonSearchPayload({
      from,
      size: options.pageSize,
      shippingCountry: options.shippingCountry,
      filters
    });

    logger.info({ label, pageNumber, from, pageSize: options.pageSize }, "Fetching TCGplayer Pokemon search page.");
    const response = await client.search(payload, options.query);
    rawPageNumber += 1;
    await writer.writeRawPage(rawPageNumber, response);

    const group = response.results[0];
    pagesFetched += 1;

    if (!group) {
      warnings.push(`${label} page ${pageNumber} returned no result group.`);
      return false;
    }

    totalResults = Math.max(totalResults, group.totalResults);

    if (group.results.length === 0) {
      warnings.push(`${label} page ${pageNumber} returned zero products.`);
      return false;
    }

    for (const product of group.results) {
      products.push(normalizePokemonProduct(product, runId, scrapedAt));
    }

    logger.info(
      {
        label,
        pageNumber,
        pageProducts: group.results.length,
        productsWritten: products.length,
        totalResults: group.totalResults
      },
      "Fetched search page."
    );

    return from + group.results.length < group.totalResults;
  }

  if (options.partitionBySet && !hasExplicitSetFilter(options.filters)) {
    const discoveryPayload = buildPokemonSearchPayload({
      from: 0,
      size: 1,
      shippingCountry: options.shippingCountry,
      filters: options.filters
    });
    const discoveryResponse = await client.search(discoveryPayload, options.query);
    const partitions = getSetPartitions(discoveryResponse);
    totalResults = discoveryResponse.results[0]?.totalResults ?? 0;

    if (partitions.length === 0) {
      warnings.push("Set partitioning was requested, but no setName aggregations were returned. Falling back to linear scraping.");
    } else {
      logger.info({ partitions: partitions.length, totalResults }, "Scraping Pokemon products partitioned by setName.");

      for (const partition of partitions) {
        if (pagesFetched >= options.maxPages) {
          warnings.push(`Stopped after reaching maxPages=${options.maxPages}.`);
          break;
        }

        const partitionFilters: SearchFilterOptions = {
          ...options.filters,
          setName: [partition.value]
        };
        const pagesForPartition = Math.ceil(partition.count / options.pageSize);

        for (let pageNumber = 1; pageNumber <= pagesForPartition; pageNumber += 1) {
          if (pagesFetched >= options.maxPages) {
            warnings.push(`Stopped after reaching maxPages=${options.maxPages}.`);
            break;
          }

          const hasNextPage = await fetchPage(pageNumber, partitionFilters, `set:${partition.value}`);

          if (!hasNextPage) {
            break;
          }
        }
      }
    }
  }

  if (products.length === 0) {
    if (!options.partitionBySet && options.pageSize * (options.startPage - 1 + options.maxPages) > 10_000) {
      warnings.push("TCGplayer search rejects offsets around 10000. Use --partition-by-set for complete Pokemon exports.");
    }

    for (let pageIndex = 0; pageIndex < options.maxPages; pageIndex += 1) {
    const pageNumber = options.startPage + pageIndex;
    const hasNextPage = await fetchPage(pageNumber, options.filters, "linear");

    if (!hasNextPage) {
      break;
    }
  }
  }

  products.sort((a, b) => a.productId - b.productId);
  const { csvPath, jsonPath } = await writer.writeProducts(products);

  const paths = writer.getPaths(csvPath, jsonPath);
  const summary: ScrapeSummary = {
    runId,
    scrapedAt,
    totalResults,
    requestedPages: options.maxPages,
    pagesFetched,
    productsWritten: products.length,
    outputDirectory: paths.outputDirectory,
    csvPath,
    jsonPath,
    manifestPath: "",
    rawDirectory: paths.rawDirectory,
    warnings
  };

  summary.manifestPath = await writer.writeManifest(summary);

  return summary;
}
