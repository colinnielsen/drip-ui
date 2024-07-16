import { Shop } from '@/data-model/shop/ShopType';
import { getTotalAllocationBPS } from '@/data-model/farmer/FarmerDTO';
import { Coffee } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Headline, Label2, Title1 } from '../base/typography';

export function ShopCard({
  label,
  backgroundImage,
  farmerAllocations,
  id,
}: Shop) {
  const allocationTotal = getTotalAllocationBPS(farmerAllocations);

  return (
    <Link href={`/shop/${id}`}>
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden h-40 relative w-full">
          <Image
            src={backgroundImage}
            alt={label}
            quality={20}
            fill={true}
            className="rounded-3xl object-cover"
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Headline>{label}</Headline>
          <div className="flex items-center gap-x-2 text-primary-gray">
            <Label2>tbd mi</Label2>
            <div className="rounded-full h-0.5 w-0.5 bg-primary-gray" />
            <Label2>tbd district</Label2>
          </div>
          <div className="flex items-center gap-x-1">
            <Coffee />
            <p className="text-xs font-semibold">
              {allocationTotal / 100}% FOR THE GROWER
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ShopList({
  title,
  shops,
  isLoading,
}: {
  title: string;
  shops: Shop[];
  isLoading?: boolean;
}) {
  return (
    <div className="w-full px-4">
      <Title1>{title}</Title1>
      <div className="grid grid-cols-1 gap-8 mt-5">
        {isLoading
          ? Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse flex flex-col gap-y-2">
                <Skeleton className="h-40 bg-gray-300 rounded-3xl" />
                <Skeleton className="h-6 bg-gray-300 rounded w-1/4" />
                <Skeleton className="h-4 bg-gray-300 rounded w-1/3" />
                <Skeleton className="h-4 bg-gray-300 rounded w-1/2" />
              </div>
            ))
          : shops.map((shop, index) => <ShopCard key={index} {...shop} />)}
      </div>
    </div>
  );
}
