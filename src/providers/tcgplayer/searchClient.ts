import Bottleneck from "bottleneck";
import { ZodError } from "zod";
import { tcgplayerSearchResponseSchema, type TcgplayerSearchRequest, type TcgplayerSearchResponse } from "./types.js";

export interface TcgplayerSearchClientOptions {
  endpoint: string;
  mpfev: string;
  userAgent: string;
  timeoutMs: number;
  retryAttempts: number;
  minDelayMs: number;
}

export class TcgplayerSearchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false
  ) {
    super(message);
    this.name = "TcgplayerSearchError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function buildSearchUrl(endpoint: string, query: string, mpfev: string): string {
  const url = new URL(endpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("isList", "false");
  url.searchParams.set("mpfev", mpfev);
  return url.toString();
}

export class TcgplayerSearchClient {
  private readonly limiter: Bottleneck;

  constructor(private readonly options: TcgplayerSearchClientOptions) {
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: options.minDelayMs
    });
  }

  async search(payload: TcgplayerSearchRequest, query = ""): Promise<TcgplayerSearchResponse> {
    return this.limiter.schedule(() => this.searchWithRetries(payload, query));
  }

  private async searchWithRetries(
    payload: TcgplayerSearchRequest,
    query: string
  ): Promise<TcgplayerSearchResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt += 1) {
      try {
        return await this.send(payload, query);
      } catch (error) {
        lastError = error;

        const retryable =
          error instanceof TcgplayerSearchError ? error.retryable : true;

        if (!retryable || attempt === this.options.retryAttempts) {
          throw error;
        }

        const backoffMs = Math.min(30_000, 1_000 * 2 ** attempt);
        const jitterMs = Math.floor(Math.random() * 250);
        await sleep(backoffMs + jitterMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async send(
    payload: TcgplayerSearchRequest,
    query: string
  ): Promise<TcgplayerSearchResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(buildSearchUrl(this.options.endpoint, query, this.options.mpfev), {
        method: "POST",
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          origin: "https://www.tcgplayer.com",
          referer: "https://www.tcgplayer.com/",
          "user-agent": this.options.userAgent
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const bodyText = await response.text();

      if (!response.ok) {
        throw new TcgplayerSearchError(
          `TCGplayer search request failed with HTTP ${response.status}: ${bodyText.slice(0, 300)}`,
          response.status,
          isRetryableStatus(response.status)
        );
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(bodyText);
      } catch (error) {
        throw new TcgplayerSearchError(
          `TCGplayer returned non-JSON search response: ${error instanceof Error ? error.message : String(error)}`,
          response.status,
          true
        );
      }

      return tcgplayerSearchResponseSchema.parse(parsed);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new TcgplayerSearchError(
          `TCGplayer search response shape changed: ${error.message}`,
          undefined,
          false
        );
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new TcgplayerSearchError(
          `TCGplayer search request timed out after ${this.options.timeoutMs}ms`,
          undefined,
          true
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

