import { InfoCard } from '@/components/ui/info-card';
import { DripTokenSVG } from '@/components/ui/icons';
import { Title2, Label1, Label2 } from '@/components/ui/typography';
import { RewardTokenDistribution } from '@/data-model/order/OrderType';

export const DripRewardCard = ({
  distribution,
}: {
  distribution: RewardTokenDistribution;
}) => {
  return (
    <InfoCard
      className="h-32"
      left={
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-l-3xl">
          <DripTokenSVG className="w-12 h-12" />
        </div>
      }
      info={
        <div className="flex flex-col gap-2 py-4 text-left">
          <Title2>Drip Rewards!</Title2>
          <Label1 className="text-primary-gray">
            You earned{' '}
            <span className="font-semibold text-purple-600">
              {distribution.tokenAmount}
            </span>{' '}
            reward tokens from this purchase
          </Label1>
          <Label2 className="underline text-purple-600">
            Learn more about rewards
          </Label2>
        </div>
      }
    />
  );
};
