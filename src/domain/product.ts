export type Money = number | null;

export interface SearchFilterOptions {
  setName?: string[];
  rarityName?: string[];
  cardType?: string[];
}

export interface ListingSummary {
  listingId: number | null;
  condition: string | null;
  printing: string | null;
  language: string | null;
  sellerName: string | null;
  quantity: number | null;
  price: Money;
  shippingPrice: Money;
  priceWithShipping: Money;
}

export interface PokemonProduct {
  runId: string;
  scrapedAt: string;
  source: "tcgplayer-search-api";
  productLineName: string;
  productLineId: number | null;
  productId: number;
  productName: string;
  cleanName: string;
  setName: string | null;
  setCode: string | null;
  setId: number | null;
  rarity: string | null;
  cardNumber: string | null;
  cardType: string[];
  sealed: boolean;
  releaseDate: string | null;
  productUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  marketPrice: Money;
  lowestPrice: Money;
  lowestPriceWithShipping: Money;
  medianPrice: Money;
  listingsCount: number;
  availability: "Available" | "Out of Stock";
  currency: "USD";
  lowestListing: ListingSummary | null;
}

export interface ScrapeSummary {
  runId: string;
  scrapedAt: string;
  totalResults: number;
  requestedPages: number;
  pagesFetched: number;
  productsWritten: number;
  outputDirectory: string;
  csvPath: string;
  jsonPath: string;
  manifestPath: string;
  rawDirectory: string | null;
  warnings: string[];
}

