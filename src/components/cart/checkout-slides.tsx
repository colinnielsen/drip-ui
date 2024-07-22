import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { Overview } from './overview';

// const DevButtons = () => {
//   const { scrollNext, scrollPrev } = useCarousel();
//   return (
//     <div className="z-[10000] flex justify-center items-center gap-4 absolute bottom-5 left-5">
//       <button onClick={scrollPrev} className="bg-slate-200 p-2 rounded-md">
//         {'<-'}
//       </button>
//       <button onClick={scrollNext} className="bg-slate-200 p-2 rounded-md">
//         {'->'}
//       </button>
//     </div>
//   );
// };

// const CheckoutSlides = () => {
//   return (

//   );
// };

export default function ({ shop, cart }: { shop: Shop; cart: Order }) {
  // return <Overview cart={cart} shop={shop} />;
  return (
    <Carousel
      className="h-full"
      opts={{ duration: 12, watchDrag: false, align: 'center' }}
      stiff
    >
      <CarouselContent className="h-full">
        <CarouselItem className="w-screen h-full overflow-y-scroll">
          <Overview cart={cart} shop={shop} />
        </CarouselItem>
        <CarouselItem className="w-screen h-full bg-blue-500">...</CarouselItem>
        <CarouselItem className="w-screen h-full bg-green-500">
          ...
        </CarouselItem>
      </CarouselContent>
      <div className="absolute top-7 right-20">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  );
}
