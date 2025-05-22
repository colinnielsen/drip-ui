import { Schema as S } from 'effect';
import { S_UUID } from './base';
import { S_CurrenciesUnion, S_USDC } from './currency';
import { DiscountId } from '@/data-model/discount/DiscountDTO';

// Source Config Schema
const ItemSourceConfigSchema = S.Union(
  S.Struct({
    type: S.Literal('slice'),
    id: S.String,
    version: S.Number,
  }),
  S.Struct({
    type: S.Literal('square'),
    id: S.String,
  }),
);

// ItemVariant Schema
const ItemVariantSchema = S.Struct({
  id: S_UUID,
  __sourceConfig: ItemSourceConfigSchema,
  name: S.String,
  image: S.String,
  description: S.String,
  price: S_CurrenciesUnion,
  availability: S.optional(
    S.Union(
      S.Literal('onsite-only'),
      S.Literal('online-only'),
      S.Literal('delivery'),
    ),
  ),
});

// ItemMod Schema
const ItemModSchema = S.Struct({
  id: S_UUID,
  __sourceConfig: ItemSourceConfigSchema,
  category: S.Union(S.String, S.Null),
  name: S.String,
  price: S_CurrenciesUnion,
  quantity: S.Number,
});

// Item Schema
const ItemSchema = S.Struct({
  id: S_UUID,
  name: S.String,
  description: S.String,
  image: S.String,
  category: S.Union(S.String, S.Null),
  variants: S.mutable(S.Array(ItemVariantSchema)).pipe(S.minLength(1)),
  mods: S.optional(S.NullOr(S.mutable(S.Array(ItemModSchema)))),
});

// Discount Schema
const DiscountSchema = S.Struct({
  id: S.String.pipe(S.fromBrand(DiscountId)),
  name: S.String,
  amount: S_CurrenciesUnion,
  type: S.Union(S.Literal('PERCENTAGE'), S.Literal('FIXED')),
  scope: S.Union(
    S.Literal('ITEM'),
    S.Literal('ORDER'),
    S.Literal('USER'),
    S.Literal('CATEGORY'),
  ),
});

// LineItem Schema
const LineItemSchema = S.Struct({
  uniqueId: S.String, // LineItemUniqueId
  item: ItemSchema,
  variant: ItemVariantSchema,
  quantity: S.Number,
  mods: S.optional(S.NullOr(S.mutable(S.Array(ItemModSchema)))),
  subtotal: S_CurrenciesUnion,
  discounts: S.optional(S.NullOr(S.mutable(S.Array(DiscountSchema)))),
  totalDiscount: S.optional(S.NullOr(S_CurrenciesUnion)),
  total: S_CurrenciesUnion,
});

// Cart Schema
export const CartSchema = S.Struct({
  id: S_UUID,
  createdTimestamp: S.Date,
  shop: S_UUID,
  lineItems: S.mutable(S.Array(LineItemSchema)).pipe(S.minLength(1)),
  discounts: S.optional(S.NullOr(S.mutable(S.Array(DiscountSchema)))),
  tip: S.optional(
    S.NullOr(
      S.Struct({
        amount: S_USDC,
      }),
    ),
  ),
  quotedSubtotal: S.optional(S.NullOr(S_CurrenciesUnion)),
  quotedTaxAmount: S.optional(S.NullOr(S_CurrenciesUnion)),
  quotedDiscountAmount: S.optional(S.NullOr(S_CurrenciesUnion)),
  quotedTotalAmount: S.optional(S.NullOr(S_CurrenciesUnion)),
});

// Type inference
export type Cart = typeof CartSchema.Type;
