import { getPrivyAppId } from '@/lib/constants';
import { usePreferredWallet } from '@/queries/EthereumQuery';
import {
  PrivyProvider as Privy,
  useGuestAccounts,
  useUser as usePrivyUser,
  useWallets,
} from '@privy-io/react-auth';
import { useEffect, useMemo } from 'react';
import { base } from 'viem/chains';

const PrivyBootstrapper = () => {
  const { wallets } = useWallets();
  const { user } = usePrivyUser();
  const { ready, wallet } = usePreferredWallet();
  const { createGuestAccount } = useGuestAccounts();
  // const [createTimeout, setCreateTimeout] = useEffect();

  const connectedWalletIsExternal =
    wallet && wallet.connectorType !== 'embedded';

  // if privy is ready and the user does not have a guest account, and they have not connected their own wallet. create a guest account for them.
  useEffect(() => {
    // if privy is not ready
    if (!ready) return console.debug('1 should not create acct');
    // // if the user is a guest user already
    // if (user && user.isGuest) return console.debug('2 should not create acct');
    // if there is already an embedded wallet in the privy wallets array
    if (wallets?.some(w => w.connectorType === 'embedded'))
      return console.debug('2 should not create acct');

    if (connectedWalletIsExternal)
      return console.debug('3 should not create acct');

    const timeout = setTimeout(() => {
      console.debug('!!!creating guest account!!!');
      createGuestAccount();
    }, 4_000);

    return () => {
      console.debug('clear guest account timeout');
      return clearTimeout(timeout);
    };
  }, [
    wallet,
    wallets.length,
    ready,
    user,
    createGuestAccount,
    connectedWalletIsExternal,
  ]);

  return null;
};

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = useMemo(() => getPrivyAppId(), []);
  return (
    <Privy
      appId={appId}
      config={{
        defaultChain: base,
        supportedChains: [base],
        // Customize Privy's appearance in your app
        appearance: {
          theme: 'light',
          // landingHeader: 'One day, we want your grandma to be able to use Drip',
          // loginMessage:
          //   '...but in the meantime, help us beta test by connecting your web3 wallet 👇',
          // accentColor: '#446144',
          // logo: '/grandma.png',
          walletList: [
            'coinbase_wallet',
            'wallet_connect',
            'rainbow',
            'detected_wallets',
          ],
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
      <PrivyBootstrapper />
    </Privy>
  );
}
