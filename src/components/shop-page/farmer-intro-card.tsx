import { Skeleton } from '@/components/ui/skeleton';
import { useFarmer } from '@/queries/FarmerQuery';
import { MapPin } from '@phosphor-icons/react/dist/ssr';
import { UUID } from 'crypto';
import Image from 'next/image';
import Link from 'next/link';

function FarmerLoadingCard() {
  return (
    <Skeleton className="w-full justify-center rounded-3xl overflow-clip min-h-[134px]" />
  );
}

function FarmerIntroCard({
  farmerId,
  allocationBPS,
}: {
  farmerId: UUID;
  allocationBPS: number;
}) {
  const { isLoading, data: farmer, error } = useFarmer(farmerId);

  if (isLoading) return <FarmerLoadingCard />;
  if (error) return <div>Error: {error.message}</div>;
  if (!farmer) return <div>Farmer not found</div>;

  return (
    <div className="grid grid-cols-3 w-full justify-center items-center rounded-3xl bg-secondary-background overflow-clip h-32">
      <div className="relative bg-red col-span-1 w-full h-full">
        <Link href={`/farmer/${farmer.id}`}>
          <Image
            src={farmer.image}
            alt={farmer.name}
            fill
            className="object-cover"
          />
        </Link>
      </div>

      <div className="col-span-2 py-4 px-4 flex flex-col gap-y-2">
        <h2>{allocationBPS / 100}% for growers</h2>
        <p className="text-gray-500 leading-5">
          {allocationBPS / 100}% of your order today goes to {farmer.name}
        </p>
        <div className="flex gap-x-1 items-center">
          <MapPin />
          {'Costa Rica'}
        </div>
      </div>
    </div>
  );
}

export default function FarmerIntroCardWrapper({
  farmer,
  allocationBPS,
  isLoading,
}: {
  farmer?: UUID;
  allocationBPS?: number;
  isLoading?: boolean;
}) {
  if (!farmer || allocationBPS === undefined || isLoading)
    return <FarmerLoadingCard />;

  return <FarmerIntroCard farmerId={farmer} allocationBPS={allocationBPS} />;
}
