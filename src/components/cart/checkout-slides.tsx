import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { CheckoutProvider } from './context';
import BasketSlide, {
  EmptyBasetSlide,
  EmptyBasket,
  LoadingBasketSlide,
} from './basket/basket';
import PaymentSlide from './payment/payment';
import { ConfirmationSlide } from './confirmation/confirmation';
import { isPaidOrder } from '@/data-model/order/OrderDTO';
import { cn, isIOSSafari } from '@/lib/utils';
import { SliceProvider } from '@slicekit/react';
import { SliceCartListener } from '@/lib/slice';

/**
 * @dev hoc for wrapping a page in a CarouselItem for the checkout flow
 */
export const AsCheckoutSlide = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <CarouselItem
    className={cn('flex flex-col w-screen h-screen overflow-y-scroll', {
      'pb-20': isIOSSafari(),
    })}
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
  if (cart === null) return <EmptyBasket />;
  if (cart === undefined) return <LoadingBasketSlide />;
  if (!shop) return "no shop (this shouldn't happen";

  return (
    <Carousel
      className="h-full"
      opts={{
        duration: 12,
        watchDrag: false,
        align: 'center',
        startIndex: cart && isPaidOrder(cart) ? 2 : 0,
      }}
      stiff
    >
      <CarouselContent className="h-full">
        <SliceProvider>
          <SliceCartListener>
            <CheckoutProvider>
              <BasketSlide cart={cart} shop={shop} />

              <PaymentSlide cart={cart} shop={shop} />

              <ConfirmationSlide cart={cart} shop={shop} />
            </CheckoutProvider>
          </SliceCartListener>
        </SliceProvider>
      </CarouselContent>
      <div className="absolute top-7 right-20">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  );
}
