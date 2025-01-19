import { USDC } from '@/data-model/_common/currency/USDC';
import { UUID } from '@/data-model/_common/type/CommonType';
import {
  buildInitialFromLineItem,
  calculateCartTotals,
} from '@/data-model/cart/CartDTO';
import { Cart } from '@/data-model/cart/CartType';
import { ItemMod } from '@/data-model/item/ItemMod';
import { Item, ItemVariant } from '@/data-model/item/ItemType';
import {
  LineItem,
  LineItemUniqueId,
} from '@/data-model/order/LineItemAggregate';
import { createLineItemAggregate } from '@/data-model/order/OrderDTO';
import { LocalStorageCartPersistance } from '@/infrastructures/local-storage/CartPersistance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pipe } from 'effect';
import { useUserId } from './UserQuery';

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

const addLineItemToCart = (cart: Cart, lineItem: LineItem): Cart => {
  // see if the line item already exists
  const existingLineItemIndex = cart.lineItems.findIndex(
    existing => existing.uniqueId === lineItem.uniqueId,
  );

  // if it doesn't exist, push it to the list
  if (existingLineItemIndex === -1)
    return {
      ...cart,
      lineItems: [...cart.lineItems, lineItem],
    };

  // if it does exist, update the quantity
  const updatedLineItems = cart.lineItems.map(existing =>
    existing.uniqueId === lineItem.uniqueId
      ? {
          ...existing,
          quantity: existing.quantity + lineItem.quantity,
        }
      : existing,
  );

  const updatedCart = {
    ...cart,
    lineItems: updatedLineItems,
  };

  const updatedCartWithPrices = {
    ...updatedCart,
    ...calculateCartTotals(updatedCart),
  };

  return updatedCartWithPrices satisfies Cart;
};

const validateLineItem = (lineItem: LineItem) => {
  if (lineItem.quantity < 1) throw new Error('Quantity must be positive');
  // Add more validation as needed
  return lineItem;
};

export const useAddToCart = ({ shopId }: { shopId: UUID }) => {
  const { data: userId } = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      item,
      variant,
      quantity,
      mods,
    }: {
      item: Item;
      variant: ItemVariant;
      quantity: number;
      mods: ItemMod[];
    }) => {
      if (!userId) throw new Error('User ID is required');
      if (quantity < 1) throw new Error('Quantity must be positive');

      const lineItem = validateLineItem(
        createLineItemAggregate({
          item,
          variant,
          quantity,
          mods,
        }),
      );

      const prevCart = await LocalStorageCartPersistance.get();

      if (prevCart && prevCart.shop !== shopId)
        throw new Error('Cannot add items from different shops to cart');

      const nextCart =
        prevCart === null
          ? buildInitialFromLineItem({
              shopId,
              item,
              userId: userId!,
              variant,
              mods,
            })
          : addLineItemToCart(prevCart, lineItem);
      await LocalStorageCartPersistance.save(nextCart);

      // Invalidate cart query after successful mutation
      await queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEY(),
      });

      return nextCart;
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

      const nextCart: Cart | null = pipe(
        // pipe over cart
        cart,
        // add the new lineitems
        c => ({
          ...c,
          lineItems: c.lineItems
            .map(lineItem => {
              if (lineItem.uniqueId !== lineItemUniqueId) return lineItem;
              // if the quantity is 1, remove the line item, because the next quantity will be 0
              if (lineItem.quantity === 1) return null;

              return {
                ...lineItem,
                quantity: lineItem.quantity - 1,
              };
            })
            .filter(li => !!li),
        }),
        // recalc the cartTotal
        c =>
          ({
            ...c,
            ...calculateCartTotals(c),
          }) satisfies Cart,
        // if the lineItems are empty, return null
        cartWithUpdatedTotals =>
          cartWithUpdatedTotals.lineItems.length === 0
            ? null
            : cartWithUpdatedTotals,
      );

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
