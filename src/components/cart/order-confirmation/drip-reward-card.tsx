import { InfoCard } from '@/components/ui/info-card';
import { Title2, Label1, Label2 } from '@/components/ui/typography';
import { RewardTokenDistribution } from '@/data-model/order/OrderType';
import Image from 'next/image';

export const DripRewardCard = ({
  distribution,
}: {
  distribution: RewardTokenDistribution;
}) => {
  return (
    <InfoCard
      className="h-32"
      left={
        <div className="flex items-center justify-center w-full h-full bg-background border rounded-l-3xl">
          <Image
            src="/drip-logo.png"
            alt="Drip logo"
            width={80}
            height={80}
            className="rounded-lg"
          />
        </div>
      }
      info={
        <div className="flex flex-col gap-2 py-4 text-left">
          <Title2>Drip Rewards!</Title2>
          <Label1 className="text-primary-gray">
            You earned{' '}
            <span className="font-semibold text-black">
              {distribution.tokenAmount}
            </span>{' '}
            reward tokens from this purchase
          </Label1>
          <Label2 className="underline text-black">
            Learn more about rewards
          </Label2>
        </div>
      }
    />
  );
};
