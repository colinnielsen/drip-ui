import { BASE_RPC_CONFIG, getPrivyAppId } from '@/lib/constants';
import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { useMemo } from 'react';
import { createConfig } from '@privy-io/wagmi';

export const privyWagmiConfig = createConfig({
  chains: BASE_RPC_CONFIG.chains,
  transports: {
    '8453': BASE_RPC_CONFIG.transport,
  },
}) as any;

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = useMemo(() => getPrivyAppId(), []);
  return (
    <Privy
      appId={appId}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          showWalletLoginFirst: true,
          theme: 'light',
          accentColor: '#446144',
          logo: '/drip.jpg',
          walletList: ['coinbase_wallet', 'rainbow', 'detected_wallets'],
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        externalWallets: {
          coinbaseWallet: {
            connectionOptions: 'all',
          },
        },
      }}
    >
      {children}
    </Privy>
  );
}
