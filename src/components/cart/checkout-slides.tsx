import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { usePrevious } from '@/lib/hooks/utility-hooks';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import { useCartDrawer } from '../ui/drawer';
import BasketSlide, { EmptyBasket, LoadingBasketSlide } from './basket/basket';
import { CheckoutProvider } from './context';
import { ConfirmationSlide } from './order-confirmation/order-confirmation';
import PaymentSlide from './payment/payment';

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
  const { setOpen } = useCartDrawer();

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
