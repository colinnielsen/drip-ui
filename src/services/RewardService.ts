import { Order } from '@/data-model/order/OrderType';
import { createEffectService } from '@/lib/effect';
import { metalClient } from '@/lib/metal/MetalClient';
import userService from './UserService';

const REWARD_MULTIPLIERS = {
  tip: 0.3,
  order: 0.15,
  farmerTip: 0.5,
};

const calculateRewardAmount = (order: Order) => {
  const orderCostUSD = order.subtotal.toUSDC().toUSD();
  const tipCostUSD = order?.tip?.amount.toUSDC().toUSD();

  const orderReward = Math.floor(orderCostUSD * REWARD_MULTIPLIERS.order * 100);

  const tipReward = tipCostUSD
    ? Math.floor(tipCostUSD * REWARD_MULTIPLIERS.tip * 100)
    : 0;
  console.log({ orderReward, tipReward, orderCostUSD, tipCostUSD });

  return orderReward + tipReward;
};

/**
 * Handles the distribution of rewards based on application events.
 */
export const triggerOrderCompletionReward = async (
  order: Order,
): Promise<{ sent: boolean; rewardAmount: number }> => {
  try {
    const user = await userService.findById(order.user);
    // Don't throw, just skip reward if user/wallet missing
    if (!user || !user.wallet?.address) return { sent: false, rewardAmount: 0 };

    const rewardAmount = calculateRewardAmount(order);

    if (rewardAmount === 0) return { sent: false, rewardAmount: 0 };

    // Use the MetalClient to distribute the tokens
    const response = await metalClient.distributeTokens({
      amount: rewardAmount,
      sendToAddress: user.wallet.address,
    });

    if (!response.success) {
      console.error(
        `[RewardService] Metal API distribution failed for order ${order.id}.`,
      );
      return { sent: false, rewardAmount: 0 };
    }

    return { sent: true, rewardAmount };
  } catch (error) {
    console.error(
      `[RewardService] Metal API Call failed during reward distribution for order ${order.id}:`,
      error,
    );
    return { sent: false, rewardAmount: 0 };
  }
};

export const EffectfulRewardService = createEffectService({
  triggerOrderCompletionReward,
});
