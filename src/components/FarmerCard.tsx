import { Skeleton } from '@/components/ui/skeleton';
import { FarmerAllocation } from '@/data-model/types-TODO/farmer';
import { useFarmer } from '@/queries/FarmerQuery';
import { MapPin } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';

export function FarmerCard({ allocation }: { allocation: FarmerAllocation }) {
  const { farmer: farmerId, allocationBPS } = allocation;

  const query = useFarmer(farmerId);
  const farmer = query.data;

  if (query.isLoading) return <FarmerLoadingCard />;
  if (query.isError) return <div>Error: {query.error.message}</div>;
  if (!farmer) return <div>Farmer not found</div>;

  return (
    <div className="grid grid-cols-3 w-full justify-center items-center rounded-3xl bg-secondary-background overflow-clip">
      <div className="relative bg-red col-span-1 w-full h-full">
        <Link href={`/farmer/${allocation.farmer}`}>
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

export function FarmerLoadingCard() {
  return (
    <Skeleton className="w-full justify-center rounded-3xl overflow-clip min-h-[134px]" />
  );
}
