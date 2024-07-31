import { Farmer } from '@/data-model/farmer/FarmerType';
import { ItemCarousel } from '../ui/item-carousel';
import Image from 'next/image';
import { Label1 } from '../ui/typography';
import { Skeleton } from '../ui/skeleton';

export const FarmerBio = ({ farmer }: { farmer: Farmer | 'loading' }) => {
  return (
    <div className="flex flex-col gap-4">
      {farmer === 'loading' ? (
        <div className="flex flex-col gap-1  px-6">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      ) : (
        <Label1 className="px-6 text-primary-gray">
          {farmer.bio ?? 'This farmer has no bio yet.'}
        </Label1>
      )}
      <ItemCarousel
        className="pl-6 overflow-scroll"
        data={
          farmer === 'loading'
            ? new Array(3).fill(null)
            : farmer?.bioImages || []
        }
        renderFn={(img, index) =>
          img === null ? (
            <Skeleton key={index} className="w-[120px] h-[120px] rounded-3xl" />
          ) : (
            <div
              className="border-light-gray border w-[120px] h-[120px] rounded-3xl overflow-clip relative"
              key={index}
            >
              <Image src={img} alt={`bio-${index}`} fill />
            </div>
          )
        }
      />
    </div>
  );
};
