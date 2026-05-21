import { describe, expect, it } from "vitest";
import { buildPokemonSearchPayload } from "../../src/providers/tcgplayer/payload.js";

describe("buildPokemonSearchPayload", () => {
  it("builds the Pokemon search payload with optional term filters", () => {
    const payload = buildPokemonSearchPayload({
      from: 48,
      size: 24,
      shippingCountry: "US",
      filters: {
        setName: ["sv-prismatic-evolutions"],
        rarityName: ["Special Illustration Rare"],
        cardType: ["Pokemon"]
      }
    });

    expect(payload.from).toBe(48);
    expect(payload.filters.term).toEqual({
      productLineName: ["pokemon"],
      setName: ["sv-prismatic-evolutions"],
      rarityName: ["Special Illustration Rare"],
      cardType: ["Pokemon"]
    });
    expect(payload.context.shippingCountry).toBe("US");
  });
});

