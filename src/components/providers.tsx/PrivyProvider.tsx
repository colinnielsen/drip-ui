import { getPrivyAppId } from '@/lib/constants';
import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { useMemo } from 'react';

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = useMemo(() => getPrivyAppId(), []);
  return (
    <Privy
      appId={appId}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
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
