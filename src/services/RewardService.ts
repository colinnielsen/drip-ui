import { Order } from '@/data-model/order/OrderType';
import { createEffectService } from '@/lib/effect';
import { metalClient } from '@/lib/metal/MetalClient';
import userService from './UserService';

const calculateRewardAmount = (order: Order) => {
  // take the reward amount 20% of the total cost
  const totalCostUSD = order.totalAmount.toUSDC().toUSD();
  const rewardAmount = Math.floor(totalCostUSD * 0.2 * 100);
  console.log('Reward amount', rewardAmount);

  return rewardAmount;
};

/**
 * Handles the distribution of rewards based on application events.
 */
export const triggerOrderCompletionReward = async (
  order: Order,
): Promise<{ success: boolean; rewardAmount: number }> => {
  try {
    const user = await userService.findById(order.user);
    // Don't throw, just skip reward if user/wallet missing
    if (!user || !user.wallet?.address) {
      return { success: false, rewardAmount: 0 };
    }

    const rewardAmount = calculateRewardAmount(order);

    if (rewardAmount === 0) return { success: false, rewardAmount: 0 };

    // Use the MetalClient to distribute the tokens
    const response = await metalClient.distributeTokens({
      amount: rewardAmount,
      sendToAddress: user.wallet.address,
    });

    if (!response.success) {
      console.error(
        `[RewardService] Metal API distribution failed for order ${order.id}.`,
      );
      return { success: false, rewardAmount: 0 };
    }

    return { success: true, rewardAmount };
  } catch (error) {
    console.error(
      `[RewardService] Metal API Call failed during reward distribution for order ${order.id}:`,
      error,
    );
    return { success: false, rewardAmount: 0 };
  }
};

export const EffectfulRewardService = createEffectService({
  triggerOrderCompletionReward,
});
