#!/usr/bin/env node
import { Command, Option } from "commander";
import { loadEnv } from "./config/env.js";
import { buildScrapeOptions, scrapePokemon } from "./application/scrapePokemon.js";
import { createLogger } from "./observability/logger.js";

function collect(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, received: ${value}`);
  }

  return parsed;
}

function parseNonNegativeInt(value: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Expected a non-negative integer, received: ${value}`);
  }

  return parsed;
}

const program = new Command();

program
  .name("tcgplayer-pokemon-prices")
  .description("Scrape Pokemon products, prices and images from TCGplayer search data.")
  .version("1.0.0");

program
  .command("scrape")
  .description("Fetch Pokemon search result pages and export normalized CSV/JSON.")
  .option("--out-dir <path>", "Output directory.", "data")
  .option("--max-pages <number>", "Maximum search pages to fetch.", parsePositiveInt, 1)
  .option("--page-size <number>", "Products per request. TCGplayer currently accepts up to 48.", parsePositiveInt, 24)
  .option("--start-page <number>", "One-based page number to start from.", parsePositiveInt, 1)
  .option("--query <text>", "Search query text.", "")
  .option("--shipping-country <code>", "Two-letter shipping country code.")
  .option("--delay-ms <number>", "Minimum delay between TCGplayer requests.", parseNonNegativeInt)
  .option("--timeout-ms <number>", "Request timeout in milliseconds.", parsePositiveInt)
  .option("--retry-attempts <number>", "Retry attempts for retryable failures.", parseNonNegativeInt)
  .option("--set <value>", "TCGplayer set URL value, for example sv-prismatic-evolutions.", collect, [])
  .option("--rarity <value>", "Rarity label, for example Special Illustration Rare.", collect, [])
  .option("--card-type <value>", "Card type label, for example Pokemon or Supporter.", collect, [])
  .option("--partition-by-set", "Scrape each Pokemon set separately to avoid TCGplayer's high-offset search limit.", false)
  .addOption(new Option("--no-raw", "Do not persist raw search responses."))
  .option("--dry-run", "Print the first request payload without making network calls.", false)
  .option("--verbose", "Enable verbose logging.", false)
  .action(async (commandOptions) => {
    const env = loadEnv();
    const logger = createLogger(commandOptions.verbose);

    const options = buildScrapeOptions(env, {
      outDir: commandOptions.outDir,
      maxPages: commandOptions.maxPages,
      pageSize: commandOptions.pageSize,
      startPage: commandOptions.startPage,
      query: commandOptions.query,
      shippingCountry: commandOptions.shippingCountry ?? env.TCGPLAYER_SHIPPING_COUNTRY,
      delayMs: commandOptions.delayMs ?? env.TCGPLAYER_MIN_DELAY_MS,
      timeoutMs: commandOptions.timeoutMs ?? env.TCGPLAYER_TIMEOUT_MS,
      retryAttempts: commandOptions.retryAttempts ?? env.TCGPLAYER_RETRY_ATTEMPTS,
      includeRaw: commandOptions.raw,
      dryRun: commandOptions.dryRun,
      partitionBySet: commandOptions.partitionBySet,
      filters: {
        setName: commandOptions.set,
        rarityName: commandOptions.rarity,
        cardType: commandOptions.cardType
      }
    });

    const summary = await scrapePokemon(env, options, logger);
    logger.info(summary, "Scrape finished.");

    if (!commandOptions.dryRun) {
      console.log(JSON.stringify(summary, null, 2));
    }
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
