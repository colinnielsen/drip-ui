import { AdditionalDistribution } from '@/data-model/order/OrderType';
import { DripRewardCard } from './drip-reward-card';
import { FarmerDistributionCard } from './farmer-distribution-card';
import { DrawerClose } from '@/components/ui/drawer';

export const ExtraDistributions = ({
  distributions,
}: {
  distributions?: AdditionalDistribution[];
}) => {
  if (!distributions || distributions.length === 0) {
    return null;
  }

  // Sort distributions: drip reward cards first, then farmer distributions
  const sortedDistributions = [...distributions].sort((a, b) => {
    // Reward token distributions should come first
    if (
      a.__type === 'reward-token-distribution' &&
      b.__type !== 'reward-token-distribution'
    ) {
      return -1;
    }
    if (
      b.__type === 'reward-token-distribution' &&
      a.__type !== 'reward-token-distribution'
    ) {
      return 1;
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {sortedDistributions.map((distribution, index) => (
        <DrawerClose key={index} asChild>
          {distribution.__type === 'reward-token-distribution' ? (
            <DripRewardCard distribution={distribution} />
          ) : distribution.__type === 'farmer-distribution' ? (
            <FarmerDistributionCard distribution={distribution} />
          ) : null}
        </DrawerClose>
      ))}
    </div>
  );
};
