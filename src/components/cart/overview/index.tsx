import { Divider } from '@/components/ui/divider';
import { DrawerClose, DrawerFooter, DrawerTitle } from '@/components/ui/drawer';
import { Title1 } from '@/components/ui/typography';
import { Order, OrderItem } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useFarmer } from '@/queries/FarmerQuery';
import { useActiveUser } from '@/queries/UserQuery';
import { X } from 'lucide-react';
import { Fragment } from 'react';
import { AddTipSection } from './add-tip';
import { CartItem } from './cart-item';
import { FooterTotal } from './footer-total';
import { GrowerBanner } from './grower-banner';
import { OrderSummary } from './summary';
import { AsCheckoutSlide } from '../checkout-slides';
import { NextButton } from './next-button';

/**
 * @dev if a cart item has the same id and the same mods, then it can be squashed with a quantity
 */
function collapseDuplicateItems(orderItems: OrderItem[]) {
  const itemMap = new Map<string, [OrderItem, number]>();

  orderItems.forEach(orderItem => {
    const allIds = [
      orderItem.item.id,
      ...orderItem.mods.map(mod => mod.id),
    ].sort();
    const key = allIds.join('-');
    if (itemMap.has(key)) itemMap.get(key)![1] += 1;
    else itemMap.set(key, [orderItem, 1]);
  });

  return Array.from(itemMap.values());
}

const Overview = ({ cart, shop }: { cart: Order; shop: Shop }) => {
  const { data: user } = useActiveUser();
  const { data: farmer } = useFarmer(shop?.farmerAllocations[0].farmer);

  if (!user) return null;

  const orderItems = collapseDuplicateItems(cart.orderItems);

  return (
    <>
      <div className="flex justify-start w-full items-center px-6 py-4">
        <DrawerClose asChild>
          <button>
            <X height={24} width={24} />
          </button>
        </DrawerClose>
      </div>

      <DrawerTitle>
        <Title1 as="div" className="text-palette-foreground px-6">
          {shop.label}
        </Title1>
      </DrawerTitle>

      <div className="flex flex-col gap-6 pt-4">
        {orderItems.map(([orderItem, quantity], index) => (
          <Fragment key={index}>
            <CartItem
              {...{ orderItem, quantity, shopId: shop.id, userId: user.id }}
            />
            <Divider />
          </Fragment>
        ))}
      </div>

      <AddTipSection cart={cart} shopId={shop.id} userId={user.id} />

      <div className="flex-grow" />
      <Divider />

      <OrderSummary cart={cart} />

      <Divider />

      <GrowerBanner {...{ farmer, allocation: shop.farmerAllocations[0] }} />

      <DrawerFooter className="p-0 w-full">
        <FooterTotal cart={cart} />
        <NextButton />
      </DrawerFooter>
    </>
  );
};

export default function ({ cart, shop }: { cart: Order; shop: Shop }) {
  return (
    <AsCheckoutSlide>
      <Overview cart={cart} shop={shop} />
    </AsCheckoutSlide>
  );
}
