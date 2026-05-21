import { z } from "zod";

const listingSchema = z
  .object({
    listingId: z.number().optional().nullable(),
    condition: z.string().optional().nullable(),
    printing: z.string().optional().nullable(),
    language: z.string().optional().nullable(),
    sellerName: z.string().optional().nullable(),
    quantity: z.number().optional().nullable(),
    price: z.number().optional().nullable(),
    shippingPrice: z.number().optional().nullable()
  })
  .passthrough();

const productSchema = z
  .object({
    listings: z.array(listingSchema).optional().default([]),
    productLineUrlName: z.string().optional().nullable(),
    productUrlName: z.string().optional().nullable(),
    rarityName: z.string().optional().nullable(),
    sealed: z.boolean().optional().default(false),
    marketPrice: z.number().optional().nullable(),
    customAttributes: z
      .object({
        number: z.string().optional().nullable(),
        cardType: z.array(z.string()).optional().nullable(),
        releaseDate: z.string().optional().nullable()
      })
      .passthrough()
      .optional()
      .nullable(),
    lowestPriceWithShipping: z.number().optional().nullable(),
    productName: z.string(),
    setId: z.number().optional().nullable(),
    setCode: z.string().optional().nullable(),
    productId: z.number(),
    medianPrice: z.number().optional().nullable(),
    setName: z.string().optional().nullable(),
    productLineId: z.number().optional().nullable(),
    productLineName: z.string().optional().nullable(),
    totalListings: z.number().optional().nullable(),
    lowestPrice: z.number().optional().nullable(),
    setUrlName: z.string().optional().nullable()
  })
  .passthrough();

const searchResultSchema = z
  .object({
    aggregations: z.record(z.string(), z.unknown()).optional().default({}),
    results: z.array(productSchema),
    algorithm: z.string().optional(),
    searchType: z.string().optional(),
    totalResults: z.number().int().nonnegative(),
    resultId: z.string().optional().nullable()
  })
  .passthrough();

export const tcgplayerSearchResponseSchema = z.object({
  errors: z.array(z.unknown()).optional().default([]),
  results: z.array(searchResultSchema)
});

export type TcgplayerListing = z.infer<typeof listingSchema>;
export type TcgplayerProduct = z.infer<typeof productSchema>;
export type TcgplayerSearchGroup = z.infer<typeof searchResultSchema>;
export type TcgplayerSearchResponse = z.infer<typeof tcgplayerSearchResponseSchema>;

export interface TcgplayerSearchRequest {
  algorithm: "sales_dismax";
  from: number;
  size: number;
  filters: {
    term: Record<string, string[]>;
    range: Record<string, unknown>;
    match: Record<string, unknown>;
  };
  listingSearch: {
    context: {
      cart: {
        packages: Record<string, unknown>;
      };
    };
    filters: {
      term: {
        sellerStatus: "Live";
        channelId: 0;
      };
      range: {
        quantity: {
          gte: 1;
        };
      };
      exclude: {
        channelExclusion: 0;
      };
    };
  };
  context: {
    cart: {
      packages: Record<string, unknown>;
    };
    shippingCountry: string;
    userProfile: Record<string, unknown>;
  };
  settings: {
    useFuzzySearch: true;
    didYouMean: Record<string, unknown>;
  };
  sort: Record<string, unknown>;
}

