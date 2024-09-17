import { Shop } from '@/data-model/shop/ShopType';
import { getTotalAllocationBPS } from '@/data-model/farmer/FarmerDTO';
import { Coffee } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Headline, Label2, Title1 } from '../ui/typography';

export function ShopCard(shop: Shop) {
  const { label, backgroundImage, farmerAllocations, id } = shop;
  const allocationTotal = getTotalAllocationBPS(farmerAllocations);
  return (
    <Link href={`/shop/${id}`}>
      <div className="flex flex-col gap-4 w-full">
        <div className="overflow-hidden h-40 relative w-full rounded-3xl">
          <Image
            src={backgroundImage}
            alt={label}
            quality={20}
            sizes="90vw"
            width={0}
            height={0}
            className="w-full h-full object-cover overflow-clip"
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Headline>{label}</Headline>
          <div className="flex items-center gap-x-2 text-primary-gray">
            {shop.__type === 'storefront' && shop.location ? (
              <Label2>{shop.location.label}</Label2>
            ) : (
              <Label2>Online only</Label2>
            )}
            {/* <div className="rounded-full h-0.5 w-0.5 bg-primary-gray" />
            <Label2>tbd district</Label2> */}
          </div>
          {allocationTotal > 0 && (
            <div className="flex items-center gap-x-1">
              <Coffee />
              <p className="text-xs font-semibold">
                {allocationTotal / 100}% FOR THE GROWER
              </p>
            </div>
          )}
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
      <div className="grid grid-cols-1 gap-8 mt-5 pb-10">
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
