import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { CheckoutProvider, useCheckoutContext } from './checkout-context';
import OverviewSlide from './overview';
import PaymentSlide from './payment';

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
      opts={{ duration: 12, watchDrag: false, align: 'center' }}
      stiff
    >
      <CarouselContent className="h-full">
        <OverviewSlide cart={cart} shop={shop} />

        <PaymentSlide cart={cart} shop={shop} />
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
