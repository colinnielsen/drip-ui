import { UUID } from '@/data-model/_common/type/CommonType';
import { Item } from '@/data-model/item/ItemType';
import { skipToken, useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { useWalletAddress } from './EthereumQuery';
import { useUserId } from './UserQuery';
import { minutes } from '@/lib/utils';

const PRICE_QUOTE_STALE_TIME = minutes(2);

function priceQuoteQueryKey({
  userId,
  wallet,
  shopId,
  itemId,
  variantId,
}: {
  userId?: UUID;
  wallet?: Address;
  shopId?: UUID;
  itemId?: UUID;
  variantId?: UUID;
} = {}): any[] {
  return [
    'price-quote',
    `userId: ${userId}`,
    `wallet: ${wallet}`,
    `shopId: ${shopId}`,
    `itemId: ${itemId}`,
  ];
}

async function getPriceQuote(
  userId: UUID,
  address: Address,
  shopId: UUID,
  item: Item,
  variantId?: UUID,
) {
  if (variantId) return item.variants.find(v => v.id === variantId)?.price;
  return item.variants[0].price;
}

export const usePriceQuote = ({
  shopId,
  item,
  variantId,
}: {
  shopId: UUID;
  item: Item;
  variantId?: UUID;
}) => {
  const { data: userId } = useUserId();
  const address = useWalletAddress();

  return useQuery({
    queryKey: priceQuoteQueryKey({
      userId,
      wallet: address ?? undefined,
      shopId,
      itemId: item.id,
      variantId,
    }),
    queryFn:
      userId && address && shopId && item.id
        ? () => getPriceQuote(userId, address, shopId, item, variantId)
        : skipToken,
    enabled: !!userId && !!address && !!shopId && !!item.id,
    staleTime: PRICE_QUOTE_STALE_TIME,
  });
};
