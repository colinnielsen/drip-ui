import { Currency } from '@/data-model/_common/currency';
import {
  addCurrencies,
  initCurrencyZero,
  subCurrencies,
} from '@/data-model/_common/currency/currencyDTO';
import { UUID } from '@/data-model/_common/type/CommonType';
import { Item, ItemId } from '@/data-model/item/ItemType';
import { DiscountQuote } from '@/data-model/discount/DiscountType';
import { pipe } from 'effect';
import { useShopDiscounts } from './ShopQuery';

const itemSelector = (itemId: ItemId) => (discounts: DiscountQuote[]) =>
  discounts.filter(discount => discount.itemId === itemId);

export const useItemDiscountQuotes = ({
  shopId,
  itemId,
}: {
  shopId: UUID;
  itemId: ItemId;
}) => {
  return useShopDiscounts({
    shopId,
    select: itemSelector(itemId),
  });
};

const addDiscounts = (discounts: DiscountQuote[]): Currency => {
  const currencyZero = initCurrencyZero(discounts[0]?.discount.amount);

  return discounts.reduce(
    (acc, discount) => addCurrencies(acc, discount.discount.amount),
    currencyZero,
  );
};

export const useItemPriceWithDiscounts = <
  TData = { originalPrice: Currency; discountedPrice: Currency },
>({
  shopId,
  item,
  select,
}: {
  shopId: UUID;
  item: Item;
  select?: (data: {
    originalPrice: Currency;
    discountedPrice: Currency;
  }) => TData;
}) => {
  return useShopDiscounts({
    shopId,
    select: d =>
      pipe(
        d,
        itemSelector(item.id),
        addDiscounts,
        d => ({
          originalPrice: item.variants[0].price,
          discountedPrice: subCurrencies(item.variants[0].price, d),
        }),
        d => select?.(d) || d,
      ),
  });
};
