import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function ItemCarousel<T>({
  data,
  renderFn,
  className,
}: {
  data: Array<T>;
  renderFn: (data: T, index: number) => ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('w-full py-2 flex flex-col', className)}>
      <Carousel
        opts={{
          align: 'start',
        }}
        className={cn('w-full max-w-sm flex', {
          'justify-center': data.length === 1,
        })}
      >
        <CarouselContent>
          {data.map((item, index) => (
            <CarouselItem key={index} className="basis-3/7 ">
              {renderFn(item, index)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
