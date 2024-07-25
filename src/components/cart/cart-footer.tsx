import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Order } from '@/data-model/order/OrderType';
import { cn, sleep } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import { useCart } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Headline, Label2 } from '../ui/typography';
import CheckoutSlides from './checkout-slides';
import { Shop } from '@/data-model/shop/ShopType';
import { EmptyBasket } from './basket/basket';

export const CartDrawer = ({
  cart,
  shop,
}: {
  cart: Order | null | undefined;
  shop: Shop | undefined;
}) => {
  return (
    <>
      <DrawerContent
        full
        className={cn(CSS_FONT_CLASS_CONFIG, 'bg-background')}
        aria-describedby="cart-footer"
      >
        {/* <div className="w-full flex flex-col overflow-y-auto h-full"> */}
        {!shop || !cart ? (
          <EmptyBasket />
        ) : (
          <CheckoutSlides {...{ shop, cart }} />
        )}
        {/* </div> */}
      </DrawerContent>
    </>
  );
};

export default function () {
  const { data: cart } = useCart();
  const { data: shop } = useShop(cart?.shop);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setIsReady] = useState(false);

  useEffect(() => {
    sleep(1000).then(() => setIsReady(true));
  }, []);

  // useEffect(() => {
  //   if (!cart) setDrawerOpen(false);
  //   if (cart) setDrawerOpen(true);
  // }, [cart]);

  return (
    <div
      className={cn(
        'transition-all',
        'transition-[600ms]',
        'translate-y-20',
        !!cart?.orderItems.length && ready ? 'translate-y-0' : '',
      )}
    >
      <Drawer key={'drawer'} handleOnly>
        <DrawerTrigger asChild>
          <button className="flex justify-between px-6 py-4 items-center bg-secondary-pop w-full h-full text-left">
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
                  {cart?.orderItems.length}
                </div>
              </div>
            </div>
          </button>
        </DrawerTrigger>
        <CartDrawer cart={cart} shop={shop} />
      </Drawer>
    </div>
  );
}
