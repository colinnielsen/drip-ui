import { USDC } from '@/data-model/_common/currency/USDC';
import { USDC_INSTANCE } from '@/lib/ethereum';
import { err } from '@/lib/utils';
import { useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Address, createWalletClient, custom, WalletClient } from 'viem';
import { base } from 'viem/chains';

export const useConnectedWallet = () => {
  const {
    ready,
    wallets: [wallet],
  } = useWallets();

  if (!ready) return null;
  if (!wallet) return null;
  return wallet;
};

export const useWalletClient = () => {
  const [client, setClient] = useState<WalletClient | null>(null);
  const wallet = useConnectedWallet();

  useEffect(() => {
    setClient(null);
    wallet?.getEthereumProvider().then(p => {
      const client = createWalletClient({
        chain: base,
        transport: custom(p),
      });

      setClient(client);
    });
  }, [wallet?.address]);

  return client;
};

export const useWalletAddress = () => {
  const wallet = useConnectedWallet();

  if (!wallet) return null;
  return wallet.address as Address;
};

export const useUSDCBalance = ({
  pollingInterval,
}: {
  pollingInterval?: number;
} = {}) => {
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
    refetchInterval: pollingInterval,
  });
};

export const useUSDCAllowance = ({
  spender,
  pollingInterval,
}: {
  spender?: Address;
  pollingInterval?: number;
}) => {
  const wallet = useWalletAddress();

  return useQuery({
    queryKey: ['usdc-allowance', wallet],
    queryFn: async () =>
      wallet && spender
        ? await USDC_INSTANCE.read
            .allowance([wallet, spender])
            .then(balance => USDC.fromWei(balance))
        : err('Address is required'),
    enabled: !!wallet && !!spender,
    refetchInterval: pollingInterval,
  });
};
