import { axiosFetcher } from '@/lib/utils';
import { ACTIVE_USER_QUERY_KEY, useActiveUser } from '@/queries/UserQuery';
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { PrivyProvider } from '../providers.tsx/PrivyProvider';
import CheckoutButton from '../ui/checkout-button';
import { Mono } from '../ui/typography';

type CheckoutStep =
  | 'initializing'
  | 'signup'
  | 'login'
  | 'get-usdc'
  | 'checkout';

const useLoginOrCreateUser = ({ onLogin }: { onLogin?: () => void }) => {
  const { login } = useLogin({
    onComplete: () =>
      axiosFetcher('/api/users/upsert', {
        withCredentials: true,
        method: 'POST',
      }).then(onLogin),
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
  const { data: user, isLoading: userLoading } = useActiveUser();

  if (!ready || userLoading || !user) return 'initializing';
  if (user.__type === 'session') return 'signup';
  if ((user.__type === 'user' && !authenticated) || wallets.length === 0)
    return 'login';
  const [wallet] = wallets;
  const balance = 4; //wallet.address;

  if (balance < total) return 'get-usdc';

  return 'checkout';
};

const CheckoutFlow = () => {
  const { authenticated, logout, ready } = usePrivy();
  const queryClient = useQueryClient();

  const invalidateUser = () =>
    queryClient.invalidateQueries({ queryKey: [ACTIVE_USER_QUERY_KEY] });
  const loginOrCreate = useLoginOrCreateUser({ onLogin: invalidateUser });

  const step = useDetermineCheckoutStep({ total: 8.42 });

  if (!ready) return null;

  return (
    <CheckoutButton
      className="bg-secondary-pop py-6"
      onClick={() => (authenticated ? logout() : loginOrCreate())}
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
