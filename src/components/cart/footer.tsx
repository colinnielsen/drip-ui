import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { cn, sleep } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import { ORDERS_QUERY_KEY, useCart } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { ACTIVE_USER_QUERY_KEY } from '@/queries/UserQuery';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatedTimer } from '../ui/icons';
import { Headline, Label2 } from '../ui/typography';
import CheckoutSlides from './checkout-slides';

export const CartDrawer = ({
  cart,
  shop,
}: {
  cart: Order | null | undefined;
  shop: Shop | undefined;
}) => {
  const queryClient = useQueryClient();
  useLoginOrCreateUser({
    onLogin: data => {
      queryClient.setQueryData([ACTIVE_USER_QUERY_KEY], data);
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY, data.id],
      });
    },
  });

  return (
    <>
      <DrawerContent
        full
        className={cn(CSS_FONT_CLASS_CONFIG, 'bg-background')}
        aria-describedby="cart-footer"
      >
        <CheckoutSlides {...{ shop, cart }} />
      </DrawerContent>
    </>
  );
};

export default function () {
  const { data: cart } = useCart();
  const { data: shop } = useShop(cart?.shop);
  const [ready, setIsReady] = useState(false);

  useEffect(() => {
    sleep(1000).then(() => setIsReady(true));
  }, []);

  // useEffect(() => {
  //   if (!cart) setDrawerOpen(false);
  //   if (cart) setDrawerOpen(true);
  // }, [cart]);

  // console.log({ cart });

  return (
    <Drawer key={'drawer'} handleOnly>
      <DrawerTrigger asChild>
        <button
          className={cn(
            'shadow-[4px_0px_60px_0px_rgba(0,0,0,0.20)]',
            'relative',
            'flex justify-between px-6 py-4 items-center bg-secondary-pop w-full text-left ',
            'transition-all',
            'transition-[600ms]',
            'top-[100px]',
            !!cart?.orderItems?.length && ready ? 'top-0' : '',
          )}
        >
          <div className="flex flex-col gap-1">
            <Label2 className="text-light-gray">Pickup Store</Label2>
            <Headline className="flex items-center gap-2 text-light-gray">
              <p>{shop?.label}</p>
              <div className="rounded-full h-1 w-1 bg-white"></div>
              <p> 0.7mi</p>
            </Headline>
          </div>
          <div className="relative flex justify-center items-center">
            {cart?.status === 'pending' ? (
              <>
                <ShoppingCart
                  height={40}
                  width={40}
                  color="white"
                  strokeWidth={1.5}
                />
                <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
                  <div className="text-white text-xs leading-none font-bold font-libreFranklin ml-1">
                    {cart?.orderItems?.length}
                  </div>
                </div>
              </>
            ) : (
              <AnimatedTimer />
            )}
          </div>
        </button>
      </DrawerTrigger>

      <CartDrawer cart={cart} shop={shop} key={cart?.id} />
    </Drawer>
  );
}
