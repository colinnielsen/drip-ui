import { rehydrateCurrency } from '@/data-model/_common/currency/currencyDTO';
import { BASE_CLIENT } from '@/lib/ethereum';
import { getAndValidateUserRequest, withErrorHandling } from '@/lib/next';
import { isUUID, sleep } from '@/lib/utils';
import FarmerService from '@/services/FarmerService';
import { NextApiRequest, NextApiResponse } from 'next';
import { Hex, isHex } from 'viem';

export const pollForSuccessfulTxReceiptOrThrow = async (
  txHash: Hex,
  retries = 3,
): Promise<boolean> => {
  if (retries <= 0) throw new Error('Transaction invalid');

  const receipt = await BASE_CLIENT.getTransactionReceipt({
    hash: txHash,
  }).catch(e => {
    console.error(e);
    return null;
  });

  if (!receipt) {
    await sleep(2000);
    return pollForSuccessfulTxReceiptOrThrow(txHash, retries - 1);
  }

  if (receipt.status !== 'success') return false;

  return true;
};

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  //
  /// validate inputs
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id: farmerId } = req.query;
  const userId = getAndValidateUserRequest(req);
  const { amount: amountParam, txHash: txHashParam } = req.body;
  if (
    !amountParam ||
    !txHashParam ||
    !rehydrateCurrency(amountParam) ||
    !isHex(txHashParam)
  )
    return res.status(400).json({ error: 'Invalid amount or txHash' });

  if (!isUUID(farmerId))
    return res.status(400).json({ error: 'Invalid farmerId' });
  const farmer = await FarmerService.findById(farmerId);
  if (!farmer)
    return res
      .status(404)
      .json({ error: `Farmer with id ${farmerId} not found` });

  const amount = rehydrateCurrency(amountParam);
  const txHash = txHashParam.toLowerCase() as Hex;

  const isSuccessful = await pollForSuccessfulTxReceiptOrThrow(txHash);
  if (!isSuccessful)
    return res.status(400).json({ error: 'Transaction invalid' });

  //
  /// upsert farmer message
  const message = await FarmerService.upsertFarmerMessage({
    amount,
    farmer: farmerId,
    sendingUser: userId,
    message: null,
  });

  return res.status(200).json(message);
}, 'farmers/[id]/donate');
