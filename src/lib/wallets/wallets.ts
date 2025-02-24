import { ConnectedWallet, useWallets } from '@privy-io/react-auth';
import { Wallet } from '@privy-io/server-auth';

export const isEmbeddedWallet = (wallet: Wallet | ConnectedWallet) => {
  return wallet.connectorType === 'embedded';
};

export const getEmbeddedWallet = (wallets: (Wallet | ConnectedWallet)[]) => {
  return wallets.find(isEmbeddedWallet);
};

export const useDripWallet = () => {
  const { wallets, ready } = useWallets();
  const dripWallet = getEmbeddedWallet(wallets || []);

  return { ready, dripWallet };
};
