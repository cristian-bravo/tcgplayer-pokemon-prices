import type { PokemonProduct } from "../domain/product.js";

export const csvHeaders = [
  "runId",
  "scrapedAt",
  "source",
  "productLineName",
  "productLineId",
  "productId",
  "productName",
  "cleanName",
  "setName",
  "setCode",
  "setId",
  "rarity",
  "cardNumber",
  "cardType",
  "sealed",
  "releaseDate",
  "productUrl",
  "imageUrl",
  "thumbnailUrl",
  "marketPrice",
  "lowestPrice",
  "lowestPriceWithShipping",
  "medianPrice",
  "listingsCount",
  "availability",
  "currency",
  "lowestListingCondition",
  "lowestListingPrinting",
  "lowestListingLanguage",
  "lowestListingSellerName",
  "lowestListingQuantity",
  "lowestListingPrice",
  "lowestListingShippingPrice",
  "lowestListingPriceWithShipping"
] as const;

type CsvHeader = (typeof csvHeaders)[number];

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = Array.isArray(value) ? value.join("|") : String(value);

  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function productToRow(product: PokemonProduct): Record<CsvHeader, unknown> {
  return {
    runId: product.runId,
    scrapedAt: product.scrapedAt,
    source: product.source,
    productLineName: product.productLineName,
    productLineId: product.productLineId,
    productId: product.productId,
    productName: product.productName,
    cleanName: product.cleanName,
    setName: product.setName,
    setCode: product.setCode,
    setId: product.setId,
    rarity: product.rarity,
    cardNumber: product.cardNumber,
    cardType: product.cardType,
    sealed: product.sealed,
    releaseDate: product.releaseDate,
    productUrl: product.productUrl,
    imageUrl: product.imageUrl,
    thumbnailUrl: product.thumbnailUrl,
    marketPrice: product.marketPrice,
    lowestPrice: product.lowestPrice,
    lowestPriceWithShipping: product.lowestPriceWithShipping,
    medianPrice: product.medianPrice,
    listingsCount: product.listingsCount,
    availability: product.availability,
    currency: product.currency,
    lowestListingCondition: product.lowestListing?.condition ?? null,
    lowestListingPrinting: product.lowestListing?.printing ?? null,
    lowestListingLanguage: product.lowestListing?.language ?? null,
    lowestListingSellerName: product.lowestListing?.sellerName ?? null,
    lowestListingQuantity: product.lowestListing?.quantity ?? null,
    lowestListingPrice: product.lowestListing?.price ?? null,
    lowestListingShippingPrice: product.lowestListing?.shippingPrice ?? null,
    lowestListingPriceWithShipping: product.lowestListing?.priceWithShipping ?? null
  };
}

export function toCsv(products: PokemonProduct[]): string {
  const rows = products.map(productToRow);
  return [csvHeaders, ...rows.map((row) => csvHeaders.map((header) => row[header]))]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
}

