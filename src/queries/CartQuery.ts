import { USDC } from '@/data-model/_common/currency/USDC';
import { UUID } from '@/data-model/_common/type/CommonType';
import {
  addLineItemToCart,
  calculateCartTotals,
  decrementLineItemQuantity,
} from '@/data-model/cart/CartDTO';
import { Cart } from '@/data-model/cart/CartType';
import { Discount } from '@/data-model/discount/DiscountType';
import { ItemMod } from '@/data-model/item/ItemMod';
import { Item, ItemVariant } from '@/data-model/item/ItemType';
import {
  LineItem,
  LineItemUniqueId,
} from '@/data-model/order/LineItemAggregate';
import { createLineItemAggregate } from '@/data-model/order/OrderDTO';
import { LocalStorageCartPersistance } from '@/infrastructures/local-storage/CartPersistance';
import { useErrorToast } from '@/lib/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useItemPriceWithDiscounts } from './ItemQuery';

//
//// QUERIES
//

export function CART_QUERY_KEY(cartId?: UUID) {
  return ['cart', cartId];
}

/**
 * Custom hook to fetch the cart using React Query.
 * @returns The query result containing the Cart or null.
 */
export const useCart = () => {
  return useQuery<Cart | null>({
    queryKey: CART_QUERY_KEY(),
    queryFn: () => LocalStorageCartPersistance.get(),
  });
};

//
//// MUTATIONS
//

const validateLineItem = (lineItem: LineItem) => {
  if (lineItem.quantity < 1) throw new Error('Quantity must be positive');
  // Add more validation as needed
  return lineItem;
};

export const useAddToCart = ({
  shopId,
  item,
}: {
  shopId: UUID;
  item: Item;
}) => {
  const errorToast = useErrorToast();
  const queryClient = useQueryClient();

  const { isFetching: isFetchingPriceQuote } = useItemPriceWithDiscounts({
    shopId,
    item,
  });

  return useMutation({
    mutationFn: async ({
      item,
      variant,
      quantity,
      mods,
      discounts,
    }: {
      item: Item;
      variant: ItemVariant;
      quantity: number;
      mods: ItemMod[];
      discounts: Discount[];
    }) => {
      if (isFetchingPriceQuote)
        throw new Error('price quote is still fetching');
      if (quantity < 1) throw new Error('Quantity must be positive');

      const lineItem = validateLineItem(
        createLineItemAggregate({
          item,
          variant,
          quantity,
          mods,
          discounts,
        }),
      );

      const prevCart = await LocalStorageCartPersistance.get();

      if (prevCart && prevCart.shop !== shopId)
        throw new Error('Cannot add items from different shops to cart');

      const nextCart = addLineItemToCart(
        prevCart === null
          ? { type: 'create' as const, newLineItem: lineItem, shopId }
          : {
              type: 'update' as const,
              newLineItem: lineItem,
              cart: prevCart,
            },
      );

      await LocalStorageCartPersistance.save(nextCart);

      // Invalidate cart query after successful mutation
      await queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEY(),
      });

      return nextCart;
    },
    onError(error) {
      console.log(error);
      errorToast(error);
    },
  });
};

export const useDecrementLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lineItemUniqueId,
    }: {
      lineItemUniqueId: LineItemUniqueId;
    }) => {
      const cart = await LocalStorageCartPersistance.get();

      if (!cart) return null;

      const nextCart = decrementLineItemQuantity(cart, lineItemUniqueId);

      nextCart === null
        ? await LocalStorageCartPersistance.remove(cart.id)
        : await LocalStorageCartPersistance.save(nextCart);

      // Invalidate cart query after successful mutation
      await queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEY(),
      });

      return nextCart;
    },
  });
};

export const useTipMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: 'tip' },
    mutationFn: async ({ tip }: { tip: USDC | null }) => {
      const prevCart = await LocalStorageCartPersistance.get();
      if (!prevCart) throw new Error('No cart found');

      const totals = calculateCartTotals({
        ...prevCart,
        tip: tip ? { amount: tip } : null,
      });

      const nextCart: Cart = {
        ...prevCart,
        tip: tip ? { amount: tip } : null,
        ...totals,
      };

      await LocalStorageCartPersistance.save(nextCart);
      return nextCart;
    },
    onSettled: () => {
      queryClient.refetchQueries({
        queryKey: CART_QUERY_KEY(),
      });
    },
  });
};

export const useDeleteCartMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId }: { cartId: Cart['id'] }) => {
      await LocalStorageCartPersistance.remove(cartId);
    },
    onSuccess: _ => {
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEY(),
      });
    },
  });
};
