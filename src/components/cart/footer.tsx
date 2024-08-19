import {
  Drawer,
  DrawerContent,
  DrawerContext,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { SliceCartListener, sliceKit } from '@/lib/slice';
import { cn, sleep } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import { useRecentCart } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { WagmiProvider } from '@privy-io/wagmi';
import { SliceProvider } from '@slicekit/react';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatedTimer } from '../ui/icons';
import { Headline, Label2 } from '../ui/typography';
import CheckoutSlides from './checkout-slides';

export const FooterButtonTrigger = ({
  cart,
  shop,
}: {
  cart?: Order | null;
  shop?: Shop;
}) => {
  const orderNumber =
    (!!cart &&
      'externalOrderInfo' in cart &&
      cart?.externalOrderInfo?.orderNumber) ||
    undefined;

  const label = orderNumber ? shop?.label : 'Pickup Store';
  const headline = orderNumber ? `Order #${orderNumber}` : shop?.label;

  const [cartItemCount, setCartItemCount] = useState(0);
  const cartIconRef = useRef<HTMLDivElement>(null);

  const itemCount = cart?.orderItems?.length || 0;

  useEffect(() => {
    if (itemCount !== cartItemCount && itemCount > 0) {
      setCartItemCount(itemCount || 0);
      cartIconRef.current?.classList.add('animate-cart-shake');
      setTimeout(() => {
        cartIconRef.current?.classList.remove('animate-cart-shake');
      }, 500);
    }
  }, [itemCount]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Label2 className="text-light-gray">{label}</Label2>
        <Headline className="flex items-center gap-2 text-light-gray">
          <p>{headline}</p>
          {/* <div className="rounded-full h-1 w-1 bg-white"></div>
  <p> 0.7mi</p> */}
        </Headline>
      </div>
      <div className="relative flex justify-center items-center">
        {cart?.status === '4-complete' ? (
          <CheckCircle height={25} width={25} color="white" strokeWidth={1.5} />
        ) : cart?.status === '1-pending' ? (
          <div
            ref={cartIconRef}
            className="transition-transform duration-300 ease-in-out"
          >
            <ShoppingCart
              height={40}
              width={40}
              color="white"
              strokeWidth={1.5}
            />
            <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
              <div className="text-white text-xs leading-none font-bold font-libreFranklin ml-1">
                {itemCount}
              </div>
            </div>
          </div>
        ) : cart?.status === 'cancelled' ? null : cart?.status ===
            '3-in-progress' || cart?.status === '2-submitting' ? (
          <AnimatedTimer />
        ) : null}
      </div>
    </>
  );
};

export default function CartFooter() {
  const { data: cart } = useRecentCart();
  const { data: shop } = useShop({ id: cart?.shop });
  const [ready, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    sleep(1000).then(() => setIsReady(true));
  }, []);

  return (
    <DrawerContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      <Drawer open={isOpen} dismissible={false}>
        <DrawerTrigger asChild>
          <button
            className={cn(
              'shadow-[4px_0px_60px_0px_rgba(0,0,0,0.20)]',
              'relative',
              'flex justify-between px-6 py-4 items-center bg-secondary-pop w-full text-left',
              'transition-all',
              'transition-[600ms]',
              !!cart?.orderItems?.length && ready ? 'top-0' : 'top-[100px]',
            )}
            onClick={() => setIsOpen(true)}
          >
            <FooterButtonTrigger {...{ cart, shop }} />
          </button>
        </DrawerTrigger>

        <DrawerContent
          full
          className={cn(CSS_FONT_CLASS_CONFIG, 'bg-background')}
          aria-describedby="cart-footer"
        >
          <SliceProvider>
            <SliceCartListener>
              <CheckoutSlides {...{ shop, cart }} />
            </SliceCartListener>
          </SliceProvider>
        </DrawerContent>
      </Drawer>
    </DrawerContext.Provider>
  );
}
