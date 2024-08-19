import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { cn, isIOSSafari } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import BasketSlide, { EmptyBasket, LoadingBasketSlide } from './basket/basket';
import { ConfirmationSlide } from './order-confirmation/order-confirmation';
import { CheckoutProvider } from './context';
import PaymentSlide from './payment/payment';
import { usePrevious } from '@/lib/hooks/utility-hooks';
import { useEffect } from 'react';
import { useNearestDrawer } from '../ui/drawer';
import { useRouter } from 'next/router';

/**
 * @dev hoc for wrapping a page in a CarouselItem for the checkout flow
 */
export const AsCheckoutSlide = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <CarouselItem
    className={cn(
      'flex flex-col w-screen h-screen overflow-y-scroll overflow-x-clip',
    )}
  >
    {children}
  </CarouselItem>
);

export default function CheckoutSlides({
  shop,
  cart,
}: {
  shop?: Shop;
  cart?: Order | null;
}) {
  const { asPath } = useRouter();
  const prevCart = usePrevious(cart);
  const prevPath = usePrevious(asPath);
  const { setOpen } = useNearestDrawer();

  useEffect(() => {
    if (prevCart && cart === null) setOpen(false);
    if (prevCart?.id && cart?.id && prevCart.id !== cart.id) setOpen(false);
  }, [cart, prevCart]);

  useEffect(() => {
    if (prevPath && asPath !== prevPath) setOpen(false);
  }, [asPath, prevPath]);

  if (cart === null) return <EmptyBasket />;
  if (!shop) return "no shop (this shouldn't happen";

  return (
    <Carousel
      className="h-full"
      opts={{
        duration: 12,
        watchDrag: false,
        watchSlides: false,
        align: 'center',
      }}
      stiff
    >
      <CarouselContent className="h-full">
        <CheckoutProvider>
          {cart === undefined ? (
            <LoadingBasketSlide />
          ) : (
            <>
              <BasketSlide cart={cart} shop={shop} />

              <PaymentSlide cart={cart} shop={shop} />

              <ConfirmationSlide cart={cart} shop={shop} />
            </>
          )}
        </CheckoutProvider>
      </CarouselContent>
      {/* <div className="absolute top-7 right-20">
        <CarouselPrevious />
        <CarouselNext />
      </div> */}
    </Carousel>
  );
}
