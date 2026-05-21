import { resolve } from "node:path";
import type { Logger } from "pino";
import type { AppEnv } from "../config/env.js";
import type { PokemonProduct, ScrapeSummary, SearchFilterOptions } from "../domain/product.js";
import { buildPokemonSearchPayload } from "../providers/tcgplayer/payload.js";
import { normalizePokemonProduct } from "../providers/tcgplayer/normalize.js";
import { TcgplayerSearchClient } from "../providers/tcgplayer/searchClient.js";
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
  filters: SearchFilterOptions;
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

  const productsById = new Map<number, PokemonProduct>();
  const warnings: string[] = [];
  let totalResults = 0;
  let pagesFetched = 0;

  for (let pageIndex = 0; pageIndex < options.maxPages; pageIndex += 1) {
    const pageNumber = options.startPage + pageIndex;
    const from = (pageNumber - 1) * options.pageSize;
    const payload =
      pageIndex === 0
        ? firstPayload
        : buildPokemonSearchPayload({
            from,
            size: options.pageSize,
            shippingCountry: options.shippingCountry,
            filters: options.filters
          });

    logger.info({ pageNumber, from, pageSize: options.pageSize }, "Fetching TCGplayer Pokemon search page.");
    const response = await client.search(payload, options.query);
    await writer.writeRawPage(pageNumber, response);

    const group = response.results[0];
    pagesFetched += 1;

    if (!group) {
      warnings.push(`Page ${pageNumber} returned no result group.`);
      break;
    }

    totalResults = Math.max(totalResults, group.totalResults);

    if (group.results.length === 0) {
      warnings.push(`Page ${pageNumber} returned zero products.`);
      break;
    }

    for (const product of group.results) {
      productsById.set(product.productId, normalizePokemonProduct(product, runId, scrapedAt));
    }

    const fetchedThrough = from + group.results.length;
    logger.info(
      {
        pageNumber,
        pageProducts: group.results.length,
        uniqueProducts: productsById.size,
        totalResults: group.totalResults
      },
      "Fetched search page."
    );

    if (fetchedThrough >= group.totalResults) {
      break;
    }
  }

  const products = Array.from(productsById.values()).sort((a, b) => a.productId - b.productId);
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
