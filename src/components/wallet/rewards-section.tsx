import { UserReward } from '@/pages/api/user/rewards';
import { useUserRewards } from '@/queries/RewardQuery';
import { formatDistance } from 'date-fns';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Headline, Label1, Label2 } from '../ui/typography';

const REWARD_COPY_VARIANTS = [
  'Earned',
  'Scored',
  'Received',
  'Got',
  'Snagged',
  'Bagged',
];

const CELEBRATION_EMOJIS = ['🎉', '🥳', '✨', '🌟', '💫', '🎊', '🔥', '☕'];

const getElementFromId = <T extends unknown>(array: T[], id: string): T =>
  array[Number(`0x${Buffer.from(id).toString('hex')}`) % array.length];

const getRewardCopy = (
  rewardId: string,
  rewardAmount: number,
  lineItemCount: number,
  shopName: string,
  tipAmount: number | null,
) => {
  const action = getElementFromId(REWARD_COPY_VARIANTS, rewardId);
  const emoji = getElementFromId(CELEBRATION_EMOJIS, rewardId);
  const tipBonus = tipAmount ? ' - and being a good tipper!' : '';

  return `${action} ${rewardAmount} $DRIP for buying ${lineItemCount} ${lineItemCount === 1 ? 'item' : 'items'} from ${shopName}${tipBonus} ${emoji}`;
};

const RewardItem = ({ reward }: { reward: UserReward }) => {
  const timeAgo = formatDistance(new Date(reward.timestamp), new Date(), {
    addSuffix: true,
  });

  const rewardCopy = getRewardCopy(
    reward.orderId,
    reward.rewardAmount,
    reward.lineItemCount,
    reward.shopName,
    reward.tipAmount,
  );

  return (
    <div className="flex items-start gap-3 p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0 w-12 h-12 relative rounded-full overflow-hidden border">
        {reward.shopLogo ? (
          <Image
            src={reward.shopLogo}
            alt={reward.shopName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            {reward.shopName.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Label1 className="text-sm leading-relaxed mb-1">{rewardCopy}</Label1>
        <Label2 className="text-gray-500 text-xs">{timeAgo}</Label2>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Label1 className="font-semibold text-sm">{reward.rewardAmount}</Label1>
      </div>
    </div>
  );
};

const RewardSkeleton = () => (
  <div className="flex items-start gap-3 p-4 border-b border-gray-100">
    <Skeleton className="w-12 h-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <div className="flex items-center gap-1">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 w-8" />
    </div>
  </div>
);

export const RewardSection = () => {
  const { data: rewards, isLoading, error } = useUserRewards();

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headline>Reward History</Headline>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label1 className="text-gray-500 text-center">
            Unable to load rewards. Try again later.
          </Label1>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headline>Reward History</Headline>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <RewardSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!rewards?.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headline>Reward History</Headline>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Label1 className="text-gray-500 mb-2">No rewards yet!</Label1>
            <Label2 className="text-gray-400">
              Complete orders to start earning $DRIP rewards ☕
            </Label2>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRewards = rewards.reduce(
    (sum, reward) => sum + reward.rewardAmount,
    0,
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headline>Reward History</Headline>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Label1 className="font-semibold">{totalRewards} total</Label1>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {rewards.map(reward => (
            <RewardItem key={reward.orderId} reward={reward} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
