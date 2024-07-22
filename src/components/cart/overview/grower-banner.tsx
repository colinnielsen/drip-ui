import { Farmer, FarmerAllocation } from '@/data-model/farmer/FarmerType';
import dripCup2 from '@/assets/drip-cup-2.png';
import Image from 'next/image';
import { Label1, Title2 } from '../../ui/typography';
import { Skeleton } from '../../ui/skeleton';

export const GrowerBanner = ({
  farmer,
  allocation,
}: {
  farmer?: Farmer;
  allocation: FarmerAllocation;
}) => {
  const allocPercent = allocation.allocationBPS / 100;

  return (
    <div className="p-6">
      <div className="w-full p-4 flex gap-x-2 bg-secondary-background rounded-3xl">
        <Image src={dripCup2} alt="drip-cup-2" width={80} height={80} />
        <div className="w-full flex flex-col gap-y-2">
          <Title2>{allocPercent}% for growers</Title2>
          {farmer ? (
            <Label1 className="text-primary-gray">
              {allocPercent}% of your order went to {farmer.name}'s farm.
            </Label1>
          ) : (
            <Skeleton className="h-4 w-1/2" />
          )}
        </div>
      </div>
    </div>
  );
};
