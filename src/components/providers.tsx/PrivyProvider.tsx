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
          showWalletLoginFirst: true,
          theme: 'light',
          // landingHeader: 'One day, we want your grandma to be able to use Drip',
          // loginMessage:
          //   '...but in the meantime, help us beta test by connecting your web3 wallet 👇',
          // accentColor: '#446144',
          // logo: '/grandma.png',
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
