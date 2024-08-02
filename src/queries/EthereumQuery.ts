import { USDC } from '@/data-model/_common/currency/USDC';
import { USDC_INSTANCE } from '@/lib/ethereum';
import { err } from '@/lib/utils';
import { useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';

export const useConnectedWallet = () => {
  const {
    wallets: [wallet],
  } = useWallets();

  if (!wallet) return null;
  return {
    address: wallet.address as Address,
    wallet: wallet,
  };
};

export const useUSDCBalance = () => {
  const wallet = useConnectedWallet();

  return useQuery({
    queryKey: ['usdc-balance', wallet?.address],
    queryFn: async () =>
      wallet
        ? await USDC_INSTANCE.read
            .balanceOf([wallet.address])
            .then(balance => USDC.fromWei(balance))
        : err('Address is required'),
    enabled: !!wallet,
  });
};
