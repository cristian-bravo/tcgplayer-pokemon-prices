import { describe, expect, it } from "vitest";
import type { PokemonProduct } from "../../src/domain/product.js";
import { csvHeaders, toCsv } from "../../src/exporters/csvExporter.js";

function makeProduct(overrides: Partial<PokemonProduct> = {}): PokemonProduct {
  return {
    runId: "run",
    scrapedAt: "2026-05-21T00:00:00.000Z",
    source: "tcgplayer-search-api",
    productLineName: "Pokemon",
    productLineId: 3,
    productId: 1,
    productName: "Lillie's Determination - 119/132",
    cleanName: "Lillie's Determination",
    setName: "ME01: Mega Evolution",
    setCode: "ME01",
    setId: 123,
    rarity: "Uncommon",
    cardNumber: "119/132",
    cardType: ["Supporter"],
    sealed: false,
    releaseDate: "2026-03-27T00:00:00Z",
    productUrl: "https://www.tcgplayer.com/product/1/pokemon",
    imageUrl: "https://tcgplayer-cdn.tcgplayer.com/product/1_in_1000x1000.jpg",
    thumbnailUrl: "https://tcgplayer-cdn.tcgplayer.com/product/1_200w.jpg",
    marketPrice: 0.28,
    lowestPrice: 0.97,
    lowestPriceWithShipping: 1.28,
    medianPrice: 1.1,
    listingsCount: 4,
    availability: "Available",
    currency: "USD",
    lowestListing: {
      listingId: 10,
      condition: "Near Mint",
      printing: "Normal",
      language: "English",
      sellerName: "Seller, Inc.",
      quantity: 2,
      price: 0.97,
      shippingPrice: 0.31,
      priceWithShipping: 1.28
    },
    ...overrides
  };
}

describe("toCsv", () => {
  it("writes the documented header order", () => {
    const csv = toCsv([]);
    expect(csv).toBe(csvHeaders.join(","));
  });

  it("escapes commas and quotes in row values", () => {
    const csv = toCsv([makeProduct({ productName: 'A "quoted", card' })]);
    expect(csv).toContain('"A ""quoted"", card"');
    expect(csv).toContain('"Seller, Inc."');
  });
});

