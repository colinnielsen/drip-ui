import { InfoCard } from '@/components/ui/info-card';
import { Title2, Label1, Label2 } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { FarmerDistribution } from '@/data-model/order/OrderType';
import { useFarmer } from '@/queries/FarmerQuery';
import Image from 'next/image';
import Link from 'next/link';

export const FarmerDistributionCard = ({
  distribution,
}: {
  distribution: FarmerDistribution;
}) => {
  const { data: farmer, isLoading } = useFarmer(distribution.farmerId);

  if (isLoading) {
    return (
      <InfoCard
        className="h-32"
        left={<Skeleton className="w-full h-full" />}
        info={
          <div className="flex flex-col gap-2 py-4 text-left">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-32 h-4" />
          </div>
        }
      />
    );
  }

  if (!farmer) {
    return null;
  }

  return (
    <Link href={`/farmer/${farmer.id}`}>
      <InfoCard
        className="h-32"
        left={
          <Image
            src={farmer.image}
            alt={`${farmer.name} profile`}
            fill
            className="object-cover"
          />
        }
        info={
          <div className="flex flex-col gap-2 py-4 text-left">
            <Title2>Thank you</Title2>
            <Label1 className="text-primary-gray">
              {farmer.name} just received{' '}
              <span className="font-semibold text-green-600">
                {distribution.amount.prettyFormat()}
              </span>{' '}
              from your purchase
            </Label1>
            <Label2 className="underline">
              Learn more about {farmer.name.split(' ')[0]}
            </Label2>
          </div>
        }
      />
    </Link>
  );
};
