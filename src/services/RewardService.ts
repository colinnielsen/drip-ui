import { UUID } from '@/data-model/_common/type/CommonType';
import { DRIP_REWARD_AMOUNT_PER_ORDER } from '@/lib/constants';
import { metalClient } from '@/lib/metal/MetalClient';
import userService from './UserService';

/**
 * Handles the distribution of rewards based on application events.
 */
const triggerOrderCompletionReward = async (userId: UUID, orderId: UUID) => {
  try {
    const user = await userService.findById(userId);
    if (!user || !user.wallet?.address) {
      return; // Don't throw, just skip reward if user/wallet missing
    }

    // Use the MetalClient to distribute the tokens
    const response = await metalClient.distributeTokens({
      amount: DRIP_REWARD_AMOUNT_PER_ORDER,
      sendTo: user.wallet.address,
    });

    // Log based on the actual response structure { success: boolean }

    if (!response.success) {
      console.error(
        `[RewardService] Metal API distribution failed for order ${orderId}.`,
      );
    }
  } catch (error) {
    console.error(
      `[RewardService] Metal API Call failed during reward distribution for order ${orderId}:`,
      error,
    );
  }
};

const rewardService = {
  triggerOrderCompletionReward,
};

export default rewardService;
