import type { ListingSummary, PokemonProduct } from "../../domain/product.js";
import { normalizeMoney } from "../../utils/money.js";
import { slugify } from "../../utils/slug.js";
import type { TcgplayerListing, TcgplayerProduct } from "./types.js";

function nullableNumber(value: number | null | undefined): number | null {
  return Number.isFinite(value) ? Number(value) : null;
}

function normalizeCardType(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeCleanName(productName: string, cardNumber: string | null): string {
  if (!cardNumber) {
    return productName.trim();
  }

  return productName.replace(new RegExp(`\\s+-\\s+${cardNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "").trim();
}

function buildProductUrl(product: TcgplayerProduct): string {
  const setPart = product.setUrlName ?? product.setName ?? "";
  const namePart = product.productUrlName ?? product.productName;
  const slug = slugify([product.productLineName ?? "pokemon", setPart, namePart].join(" "));
  return `https://www.tcgplayer.com/product/${product.productId}/${slug}`;
}

function buildImageUrl(productId: number, size: "full" | "thumb"): string {
  const suffix = size === "full" ? "in_1000x1000" : "200w";
  return `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_${suffix}.jpg`;
}

function normalizeListing(listing: TcgplayerListing | undefined): ListingSummary | null {
  if (!listing) {
    return null;
  }

  const price = normalizeMoney(listing.price);
  const shippingPrice = normalizeMoney(listing.shippingPrice);
  const priceWithShipping =
    price === null ? null : normalizeMoney(price + (shippingPrice ?? 0));

  return {
    listingId: nullableNumber(listing.listingId),
    condition: listing.condition ?? null,
    printing: listing.printing ?? null,
    language: listing.language ?? null,
    sellerName: listing.sellerName ?? null,
    quantity: nullableNumber(listing.quantity),
    price,
    shippingPrice,
    priceWithShipping
  };
}

export function normalizePokemonProduct(
  product: TcgplayerProduct,
  runId: string,
  scrapedAt: string
): PokemonProduct {
  const cardNumber = product.customAttributes?.number ?? null;
  const productName = product.productName.trim();
  const listingsCount = product.totalListings ?? product.listings.length;

  return {
    runId,
    scrapedAt,
    source: "tcgplayer-search-api",
    productLineName: product.productLineName ?? "Pokemon",
    productLineId: nullableNumber(product.productLineId),
    productId: product.productId,
    productName,
    cleanName: normalizeCleanName(productName, cardNumber),
    setName: product.setName ?? null,
    setCode: product.setCode ?? null,
    setId: nullableNumber(product.setId),
    rarity: product.rarityName ?? null,
    cardNumber,
    cardType: normalizeCardType(product.customAttributes?.cardType),
    sealed: product.sealed,
    releaseDate: product.customAttributes?.releaseDate ?? null,
    productUrl: buildProductUrl(product),
    imageUrl: buildImageUrl(product.productId, "full"),
    thumbnailUrl: buildImageUrl(product.productId, "thumb"),
    marketPrice: normalizeMoney(product.marketPrice),
    lowestPrice: normalizeMoney(product.lowestPrice),
    lowestPriceWithShipping: normalizeMoney(product.lowestPriceWithShipping),
    medianPrice: normalizeMoney(product.medianPrice),
    listingsCount,
    availability: listingsCount > 0 ? "Available" : "Out of Stock",
    currency: "USD",
    lowestListing: normalizeListing(product.listings[0])
  };
}

