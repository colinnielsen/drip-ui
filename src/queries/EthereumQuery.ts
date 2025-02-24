import { USDC } from '@/data-model/_common/currency/USDC';
import { USDC_INSTANCE } from '@/lib/ethereum';
import { err } from '@/lib/utils';
import { ConnectedWallet, useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Address,
  createWalletClient,
  custom,
  CustomTransport,
  JsonRpcAccount,
  WalletClient,
  WalletRpcSchema,
} from 'viem';
import { base } from 'viem/chains';

/**
 * Returns the user's preferred wallet
 * @dev this will be their own wallet if they connect it manually via MM or a wallet app
 * otherwise, this will likely the drip wallet
 */
export const usePreferredWallet = ():
  | {
      ready: false;
      wallet: null;
    }
  | {
      ready: true;
      wallet: ConnectedWallet;
    } => {
  const { ready, wallets } = useWallets();
  const [wallet] = wallets;

  if (!ready) return { ready: false, wallet: null };
  return { ready: true, wallet };
};

type WC = WalletClient<
  CustomTransport,
  typeof base,
  JsonRpcAccount<Address>,
  WalletRpcSchema
>;

export const usePreferredWalletClient = ():
  | {
      ready: false;
      client: null;
    }
  | {
      ready: true;
      client: WC;
    } => {
  const { ready, wallet: preferredWallet } = usePreferredWallet();

  const [client, setClient] = useState<WC | null>(null);

  useEffect(() => {
    setClient(null);
    if (ready && preferredWallet)
      preferredWallet.getEthereumProvider().then(p => {
        setClient(
          createWalletClient({
            account: preferredWallet.address as Address,
            chain: base,
            transport: custom(p),
          }),
        );
      });
    else setClient(null);
  }, [ready, preferredWallet]);

  if (ready === false) return { ready: false, client: null };
  return { ready: true, client: client as WC };
};

export const usePreferredWalletAddress = () => {
  const { ready, wallet: preferredWallet } = usePreferredWallet();

  // useEffect(() => {
  //   console.log('wallet reference updated!');
  //   console.log(wallet?.address);
  // }, [wallet]);

  if (!ready) return null;
  return preferredWallet!.address as Address;
};

export const useUSDCBalance = ({
  pollingInterval,
}: {
  pollingInterval?: number;
} = {}) => {
  const wallet = usePreferredWalletAddress();

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
  const preferredWalletAddress = usePreferredWalletAddress();

  return useQuery({
    queryKey: ['usdc-allowance', preferredWalletAddress],
    queryFn: async () =>
      preferredWalletAddress && spender
        ? await USDC_INSTANCE.read
            .allowance([preferredWalletAddress, spender])
            .then(balance => USDC.fromWei(balance))
        : err('Address is required'),
    enabled: !!preferredWalletAddress && !!spender,
    refetchInterval: pollingInterval,
  });
};
