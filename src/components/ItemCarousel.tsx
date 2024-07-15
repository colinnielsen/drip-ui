import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { ReactNode } from 'react';

export function ItemCarousel<T>({
  data,
  renderFn,
}: {
  data: Array<T>;
  renderFn: (data: T, index: number) => ReactNode;
}) {
  return (
    <div className="w-full py-2">
      <div className="flex flex-col gap-2">
        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full max-w-sm"
        >
          <CarouselContent>
            {data.map((item, index) => (
              <CarouselItem key={index} className=" basis-5/12">
                {renderFn(item, index)}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
