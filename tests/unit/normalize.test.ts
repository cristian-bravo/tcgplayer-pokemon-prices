import { describe, expect, it } from "vitest";
import { normalizePokemonProduct } from "../../src/providers/tcgplayer/normalize.js";

describe("normalizePokemonProduct", () => {
  it("maps TCGplayer search products to the export contract", () => {
    const product = normalizePokemonProduct(
      {
        listings: [
          {
            listingId: 782797846,
            condition: "Near Mint",
            printing: "Normal",
            language: "English",
            sellerName: "MPValues",
            quantity: 1,
            price: 0.16,
            shippingPrice: 1.31
          }
        ],
        productLineUrlName: "Pokemon",
        productUrlName: "Poke Pad 081 088",
        rarityName: "Uncommon",
        sealed: false,
        marketPrice: 0.2656,
        customAttributes: {
          number: "081/088",
          cardType: ["Item"],
          releaseDate: "2026-03-27T00:00:00Z"
        },
        lowestPriceWithShipping: 0.01,
        productName: "Poke Pad - 081/088",
        setId: 24587,
        setCode: "POR",
        productId: 684332,
        medianPrice: 0.5,
        setName: "ME03: Perfect Order",
        productLineId: 3,
        productLineName: "Pokemon",
        totalListings: 3032,
        lowestPrice: 0.01,
        setUrlName: "ME03 Perfect Order"
      },
      "run",
      "2026-05-21T00:00:00.000Z"
    );

    expect(product.productId).toBe(684332);
    expect(product.cleanName).toBe("Poke Pad");
    expect(product.marketPrice).toBe(0.27);
    expect(product.productUrl).toBe("https://www.tcgplayer.com/product/684332/pokemon-me03-perfect-order-poke-pad-081-088");
    expect(product.imageUrl).toBe("https://tcgplayer-cdn.tcgplayer.com/product/684332_in_1000x1000.jpg");
    expect(product.lowestListing?.priceWithShipping).toBe(1.47);
  });
});

