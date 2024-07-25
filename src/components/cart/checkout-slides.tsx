import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { CheckoutProvider } from './checkout-context';
import BasketSlide from './basket/basket';
import PaymentSlide from './payment/payment';
import { ConfirmationSlide } from './confirmation/confirmation';
import { isPaidOrder } from '@/data-model/order/OrderDTO';

/**
 * @dev hoc for wrapping a page in a CarouselItem for the checkout flow
 */
export const AsCheckoutSlide = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <CarouselItem className="flex flex-col w-screen h-screen overflow-y-scroll">
    {children}
  </CarouselItem>
);

function CheckoutSlides({ shop, cart }: { shop: Shop; cart: Order }) {
  return (
    <Carousel
      className="h-full"
      opts={{
        duration: 12,
        watchDrag: false,
        align: 'center',
        startIndex: isPaidOrder(cart) ? 2 : 0,
      }}
      stiff
    >
      <CarouselContent className="h-full">
        <BasketSlide cart={cart} shop={shop} />
        <PaymentSlide cart={cart} shop={shop} />
        <ConfirmationSlide cart={cart} shop={shop} />
      </CarouselContent>
      <div className="absolute top-7 right-20">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  );
}

export default function ({ shop, cart }: { shop: Shop; cart: Order }) {
  return (
    <CheckoutProvider>
      <CheckoutSlides shop={shop} cart={cart} />
    </CheckoutProvider>
  );
}
