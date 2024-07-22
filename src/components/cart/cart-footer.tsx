import { CartItem } from '@/components/cart/cart-item';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Order, OrderItem } from '@/data-model/order/OrderType';
import { cn } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import { useFarmer } from '@/queries/FarmerQuery';
import { useCart } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { useActiveUser } from '@/queries/UserQuery';
import { ShoppingCart, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Fragment, useState } from 'react';
import { Divider } from '../ui/divider';
import { Skeleton } from '../ui/skeleton';
import { Headline, Label2, Title1 } from '../ui/typography';
import { AddTipSection } from './add-tip';
import { FooterTotal } from './footer-total';
import { GrowerBanner } from './grower-banner';
import { OrderSummary } from './summary';

const DynamicCheckoutFlow = dynamic(() => import('./checkout-flow'), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-14 w-full rounded-[50px] bg-secondary-pop" />
  ),
});

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

export const CartDrawer = ({
  cart,
  drawerOpen,
}: {
  cart: Order;
  drawerOpen: boolean;
}) => {
  const { data: user } = useActiveUser();
  const { data: shop } = useShop(cart.shop);

  const { data: farmer } = useFarmer(shop?.farmerAllocations[0].farmer);

  if (!shop || !user) return null;

  const orderItems = collapseDuplicateItems(cart.orderItems);

  return (
    <>
      <DrawerTrigger asChild>
        <div className="flex justify-between px-6 py-4 items-center bg-secondary-pop">
          <div className="flex flex-col gap-1">
            <Label2 className="text-light-gray">Pickup Store</Label2>
            <Headline className="flex items-center gap-2 text-light-gray">
              <p>{shop.label}</p>
              <div className="rounded-full h-1 w-1 bg-white"></div>
              <p> 0.7mi</p>
            </Headline>
          </div>
          <div className="relative flex justify-center items-center">
            <ShoppingCart
              height={40}
              width={40}
              color="white"
              strokeWidth={1.5}
            />
            <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
              <div className="text-white text-xs leading-none font-bold font-libreFranklin ml-1">
                {cart.orderItems.length}
              </div>
            </div>
          </div>
        </div>
      </DrawerTrigger>

      <DrawerContent
        full
        className={cn(
          'flex flex-col',
          CSS_FONT_CLASS_CONFIG,
          'bg-background-card',
          'bg-white',
        )}
        aria-describedby="cart-footer"
      >
        <div className="w-full flex flex-col overflow-auto h-full">
          <div className="flex justify-start h-14 w-full items-center px-6 py-4">
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

          <GrowerBanner
            {...{ farmer, allocation: shop.farmerAllocations[0] }}
          />

          <DrawerFooter className="p-0">
            <FooterTotal cart={cart} />
            <div className="px-6 pb-6 w-full min-h-20">
              {drawerOpen && <DynamicCheckoutFlow />}
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </>
  );
};

export default function () {
  const { data: cart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!cart) return null;
  return (
    <Drawer
      key={'drawer'}
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      handleOnly
    >
      <CartDrawer cart={cart} drawerOpen={drawerOpen} />
    </Drawer>
  );
}
