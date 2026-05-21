import type { SearchFilterOptions } from "../../domain/product.js";
import type { TcgplayerSearchRequest } from "./types.js";

export interface BuildSearchPayloadOptions {
  from: number;
  size: number;
  shippingCountry: string;
  filters?: SearchFilterOptions;
}

function setIfPresent(term: Record<string, string[]>, key: string, values?: string[]): void {
  const cleaned = (values ?? []).map((value) => value.trim()).filter(Boolean);

  if (cleaned.length > 0) {
    term[key] = cleaned;
  }
}

export function buildPokemonSearchPayload(
  options: BuildSearchPayloadOptions
): TcgplayerSearchRequest {
  const term: Record<string, string[]> = {
    productLineName: ["pokemon"]
  };

  setIfPresent(term, "setName", options.filters?.setName);
  setIfPresent(term, "rarityName", options.filters?.rarityName);
  setIfPresent(term, "cardType", options.filters?.cardType);

  return {
    algorithm: "sales_dismax",
    from: options.from,
    size: options.size,
    filters: {
      term,
      range: {},
      match: {}
    },
    listingSearch: {
      context: {
        cart: {
          packages: {}
        }
      },
      filters: {
        term: {
          sellerStatus: "Live",
          channelId: 0
        },
        range: {
          quantity: {
            gte: 1
          }
        },
        exclude: {
          channelExclusion: 0
        }
      }
    },
    context: {
      cart: {
        packages: {}
      },
      shippingCountry: options.shippingCountry,
      userProfile: {}
    },
    settings: {
      useFuzzySearch: true,
      didYouMean: {}
    },
    sort: {}
  };
}

