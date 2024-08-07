import { USDC } from '@/data-model/_common/currency/USDC';
import { USDC_INSTANCE } from '@/lib/ethereum';
import { err } from '@/lib/utils';
import { useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';

export const useWalletProvider = () => {
  const {
    wallets: [wallet],
  } = useWallets();

  if (!wallet) return null;
  return wallet;
};

export const useWalletAddress = () => {
  const wallet = useWalletProvider();

  if (!wallet) return null;
  return wallet.address as Address;
};

export const useUSDCBalance = () => {
  const wallet = useWalletAddress();

  return useQuery({
    queryKey: ['usdc-balance', wallet],
    queryFn: async () =>
      wallet
        ? await USDC_INSTANCE.read
            .balanceOf([wallet])
            .then(balance => USDC.fromWei(balance))
        : err('Address is required'),
    enabled: !!wallet,
  });
};
