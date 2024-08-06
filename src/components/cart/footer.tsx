import {
  Drawer,
  DrawerContent,
  DrawerContext,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn, sleep } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import { useCart } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatedTimer } from '../ui/icons';
import { Headline, Label2 } from '../ui/typography';
import CheckoutSlides from './checkout-slides';

// export const CartDrawer = ({
//   cart,
//   shop,
// }: {
//   cart: Order | null | undefined;
//   shop: Shop | undefined;
// }) => {
//   return <></>;
// };

export default function () {
  const { data: cart } = useCart();
  const { data: shop } = useShop({ id: cart?.shop });
  const [ready, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    sleep(1000).then(() => setIsReady(true));
  }, []);

  return (
    <DrawerContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      <Drawer open={isOpen}>
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
            <div className="flex flex-col gap-1">
              <Label2 className="text-light-gray">Pickup Store</Label2>
              <Headline className="flex items-center gap-2 text-light-gray">
                <p>{shop?.label}</p>
                {/* <div className="rounded-full h-1 w-1 bg-white"></div>
              <p> 0.7mi</p> */}
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

        <DrawerContent
          full
          className={cn(CSS_FONT_CLASS_CONFIG, 'bg-background')}
          aria-describedby="cart-footer"
        >
          <CheckoutSlides {...{ shop, cart }} />
        </DrawerContent>
      </Drawer>
    </DrawerContext.Provider>
  );
}
