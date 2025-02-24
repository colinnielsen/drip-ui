import { Cart } from '@/data-model/cart/CartType';
import { Shop } from '@/data-model/shop/ShopType';
import { usePrevious } from '@/lib/hooks/utility-hooks';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import { useCartDrawer } from '../ui/drawer';
import BasketSlide, { EmptyBasket } from './basket/basket';
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
      'flex flex-col w-screen h-dvh overflow-y-scroll overflow-x-clip',
    )}
  >
    {children}
  </CarouselItem>
);

export default function CheckoutSlides({
  shop,
  cart,
}: {
  shop: Shop;
  cart: Cart;
}) {
  const { asPath } = useRouter();
  const prevPath = usePrevious(asPath);
  const { setOpen } = useCartDrawer();

  useEffect(() => {
    if (prevPath && asPath !== prevPath) setOpen(false);
  }, [asPath, prevPath]);

  if (cart === null) return <EmptyBasket />;

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
          <BasketSlide cart={cart} shop={shop} />

          <PaymentSlide cart={cart} shop={shop} />

          <ConfirmationSlide />
        </CheckoutProvider>
      </CarouselContent>
      {/* <div className="absolute top-7 right-20">
        <CarouselPrevious />
        <CarouselNext />
      </div> */}
    </Carousel>
  );
}
