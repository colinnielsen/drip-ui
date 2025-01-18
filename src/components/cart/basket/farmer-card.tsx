import dripCup2 from '@/assets/drip-cup-2.png';
import { InfoCard } from '@/components/ui/info-card';
import { UUID } from '@/data-model/_common/type/CommonType';
import { useFarmerAllocation } from '@/queries/OrderQuery';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '../../ui/skeleton';
import { Label1, Title2 } from '../../ui/typography';

export const FarmerCard = ({
  shopId,
  showPics,
  className,
}: {
  shopId: UUID;
  showPics?: boolean;
  className?: string;
}) => {
  const data = useFarmerAllocation({ shopId });
  if (!data) return null;

  const allocPercent = data.allocation.allocationBPS / 100;

  const left = !showPics ? (
    <Image src={dripCup2} alt="drip-cup-2" width={80} height={80} />
  ) : (
    <Image
      src={data.farmer.image}
      alt={'farmer-image'}
      fill
      className="object-cover"
    />
  );

  const info = (
    <Link
      href={`/farmer/${data.farmer.id}`}
      className={'w-full flex flex-col gap-y-2'}
    >
      <Title2>{allocPercent}% for growers</Title2>
      {data.farmer ? (
        <Label1 className="text-primary-gray">
          {allocPercent}% of your order goes to {data.farmer.name}&apos;s farm.
        </Label1>
      ) : (
        <Skeleton className="h-4 w-1/2" />
      )}
    </Link>
  );

  return <InfoCard left={left} info={info} className={className} />;
};
