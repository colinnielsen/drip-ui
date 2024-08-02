import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { cn, isIOSSafari } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import BasketSlide, { EmptyBasket, LoadingBasketSlide } from './basket/basket';
import { ConfirmationSlide } from './confirmation/confirmation';
import { CheckoutProvider } from './context';
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
      {
        'pb-20': isIOSSafari(),
      },
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
  if (cart === null) return <EmptyBasket />;
  if (cart === undefined) return <LoadingBasketSlide />;
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
          <BasketSlide cart={cart} shop={shop} />

          <PaymentSlide cart={cart} shop={shop} />

          <ConfirmationSlide cart={cart} shop={shop} />
        </CheckoutProvider>
      </CarouselContent>
      {/* <div className="absolute top-7 right-20">
        <CarouselPrevious />
        <CarouselNext />
      </div> */}
    </Carousel>
  );
}
