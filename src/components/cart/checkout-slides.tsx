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
import WelcomeSlide, { shouldGoToWelcomeSlide } from './welcome';

/**
 * @dev hoc for wrapping a page in a CarouselItem for the checkout flow
 */
export const AsCheckoutSlide = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <CarouselItem className="w-screen h-full overflow-y-scroll">
    {children}
  </CarouselItem>
);

function CheckoutSlides({ shop, cart }: { shop: Shop; cart: Order }) {
  const { step } = useCheckoutContext();
  return (
    <Carousel
      className="h-full"
      opts={{ duration: 12, watchDrag: false, align: 'center' }}
      stiff
    >
      <CarouselContent className="h-full">
        <OverviewSlide cart={cart} shop={shop} />

        {shouldGoToWelcomeSlide(step) ? (
          <WelcomeSlide />
        ) : (
          <CarouselItem className="w-screen h-full bg-green-500">
            ...
          </CarouselItem>
        )}
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
