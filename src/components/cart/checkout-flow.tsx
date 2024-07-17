import { Mono } from '../ui/typography';
import { Button } from '../ui/button';
import { PrivyProvider } from '../providers.tsx/PrivyProvider';
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';
import { useActiveUser } from '@/queries/UserQuery';
import CheckoutButton from '../ui/checkout-button';

type CheckoutStep =
  | 'initializing'
  | 'signup'
  | 'login'
  | 'get-usdc'
  | 'checkout';

const useLoginOrCreateUser = () => {
  const { login } = useLogin({
    onComplete: () => console.log('login complete'),
  });

  return login;
};

const useDetermineCheckoutStep = ({
  total,
}: {
  total: number;
}): CheckoutStep => {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const loginOrCreate = useLoginOrCreateUser();
  const { data: user, isLoading: userLoading } = useActiveUser();

  if (!ready || userLoading) return 'initializing';
  if (user === 'not-created') return 'signup';
  if ((user && !authenticated) || wallets.length === 0) return 'login';
  const [wallet] = wallets;
  const balance = 4; //wallet.address;

  if (balance < total) return 'get-usdc';

  return 'checkout';
};

const CheckoutFlow = () => {
  const { authenticated, login, logout, ready } = usePrivy();
  const step = useDetermineCheckoutStep({ total: 8.42 });
  console.log({ step });

  if (!ready) return null;

  return (
    <CheckoutButton
      className="bg-secondary-pop py-6"
      onClick={() => (authenticated ? logout() : login())}
    >
      <Mono className="uppercase">Checkout</Mono>
    </CheckoutButton>
  );
};

export default function () {
  return (
    <PrivyProvider>
      <CheckoutFlow />
    </PrivyProvider>
  );
}
