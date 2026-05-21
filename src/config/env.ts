import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  TCGPLAYER_SEARCH_ENDPOINT: z
    .string()
    .url()
    .default("https://mp-search-api.tcgplayer.com/v1/search/request"),
  TCGPLAYER_MPFEV: z.string().default("5199"),
  TCGPLAYER_SHIPPING_COUNTRY: z.string().length(2).default("US"),
  TCGPLAYER_MIN_DELAY_MS: z.coerce.number().int().min(0).default(10_000),
  TCGPLAYER_TIMEOUT_MS: z.coerce.number().int().min(1_000).default(30_000),
  TCGPLAYER_RETRY_ATTEMPTS: z.coerce.number().int().min(0).max(10).default(3),
  TCGPLAYER_MAX_PAGE_SIZE: z.coerce.number().int().min(1).max(48).default(48),
  TCGPLAYER_USER_AGENT: z.string().min(1).default("tcgplayer-pokemon-prices/1.0")
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(input);
}

