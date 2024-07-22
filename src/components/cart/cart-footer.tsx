import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Order } from '@/data-model/order/OrderType';
import { cn } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import { useCart } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Headline, Label2 } from '../ui/typography';
import CheckoutSlides from './checkout-slides';

export const CartDrawer = ({
  cart,
  drawerOpen,
}: {
  cart: Order;
  drawerOpen: boolean;
}) => {
  const { data: shop } = useShop(cart.shop);

  if (!shop) return null;

  return (
    <>
      <DrawerTrigger asChild>
        <div className="flex justify-between px-6 py-4 items-center bg-secondary-pop">
          <div className="flex flex-col gap-1">
            <Label2 className="text-light-gray">Pickup Store</Label2>
            <Headline className="flex items-center gap-2 text-light-gray">
              <p>{shop?.label}</p>
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
        className={cn(CSS_FONT_CLASS_CONFIG, 'bg-background')}
        aria-describedby="cart-footer"
      >
        {/* <div className="w-full flex flex-col overflow-y-auto h-full"> */}
        {drawerOpen && <CheckoutSlides {...{ shop, cart }} />}
        {/* </div> */}
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
