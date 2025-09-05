import dripLogo from '@/assets/drip.jpg';
import { Currency } from '@/data-model/_common/currency';
import {
  AdditionalDistribution,
  FarmerDistribution,
  RewardTokenDistribution,
} from '@/data-model/order/OrderType';
import { useFarmer } from '@/queries/FarmerQuery';
import Image from 'next/image';
import Link from 'next/link';
import { InfoCard } from '../ui/info-card';
import { Drip, Label1, Title2 } from '../ui/typography';

const FarmerDistributionCard = ({
  distribution,
  orderTotal,
}: {
  distribution: FarmerDistribution;
  orderTotal: Currency;
}) => {
  const { data: farmer } = useFarmer(distribution.farmerId);
  if (!farmer) return null;

  const allocPercent =
    (distribution.amount.toWei() * 100n) / orderTotal.toWei();

  const left = (
    <Image
      src={farmer.image}
      alt={'farmer-image'}
      fill
      className="object-cover"
    />
  );

  const info = (
    <Link
      href={`/farmer/${distribution.farmerId}`}
      className={'w-full flex flex-col gap-y-2'}
    >
      <Title2>{allocPercent}% for growers</Title2>
      <Label1 className="text-primary-gray">
        {allocPercent}% of your order goes to {farmer.name}&apos;s farm.
      </Label1>
    </Link>
  );
  return <InfoCard left={left} info={info} />;
};

const RewardDistributionCard = ({
  distribution,
}: {
  distribution: RewardTokenDistribution;
}) => {
  const left = (
    <Image
      src={dripLogo}
      alt="prevail token reward"
      fill
      className="object-cover"
    />
  );

  const info = (
    <div className={'w-full flex flex-col gap-y-2'}>
      <Drip>Cha-Ching!</Drip>
      <Label1 className="text-primary-gray">
        You earned <b>{distribution.tokenAmount.toFixed(2)} $PREVAIL</b> tokens
        from this order!
      </Label1>
    </div>
  );

  return <InfoCard left={left} info={info} />;
};

export const AdditionalOrderDistributions = ({
  orderTotal,
  distributions,
}: {
  orderTotal: Currency;
  distributions: AdditionalDistribution[];
}) => {
  return (
    <div>
      {distributions.map((distribution, index) => {
        if (distribution.__type === 'farmer-distribution') {
          return (
            <FarmerDistributionCard
              key={index}
              distribution={distribution}
              orderTotal={orderTotal}
            />
          );
        }
        if (distribution.__type === 'reward-token-distribution') {
          return (
            <RewardDistributionCard key={index} distribution={distribution} />
          );
        }
        return null;
      })}
    </div>
  );
};
