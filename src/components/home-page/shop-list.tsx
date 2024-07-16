import { Shop } from '@/data-model/shop/ShopType';
import { getTotalAllocationBPS } from '@/data-model/farmer/FarmerDTO';
import { Coffee } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';

export function ShopCard({
  label,
  backgroundImage,
  farmerAllocations,
  id,
}: Shop) {
  const allocationTotal = getTotalAllocationBPS(farmerAllocations);

  return (
    <Link href={`/shop/${id}`}>
      <div className="flex flex-col gap-1">
        <div className="overflow-hidden h-40 relative w-full">
          <Image
            src={backgroundImage}
            alt={label}
            quality={20}
            fill={true}
            className="rounded-3xl object-cover"
          />
        </div>
        <h3 className="font-semibold text-lg">{label}</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <p>tbd mi</p>
          <div className="rounded-full h-1 w-1 bg-neutral-400"></div>
          <p>tbd district</p>
        </div>
        <div className="flex items-center gap-1">
          <Coffee />
          <p className="text-xs font-bold">
            {allocationTotal / 100}% FOR THE GROWER
          </p>
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
      <h2 className="text-2xl font-semibold">{title}</h2>
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
