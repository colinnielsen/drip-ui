import { Order } from '@/data-model/order/OrderType';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { sliceKit } from '../../lib/slice';
import { ACTIVE_USER_QUERY_KEY, useActiveUser } from '@/queries/UserQuery';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { Address } from 'viem';
import { Skeleton } from '../ui/skeleton';
import { useConnectedWallet, useUSDCBalance } from '@/queries/EthereumQuery';
import { useCart, useCartInSliceFormat } from '@/queries/OrderQuery';
import { getOrderSummary } from '@/data-model/order/OrderDTO';
import { Mono } from '../ui/typography';
import { cn } from '@/lib/utils';

const btnClass = 'flex-grow bg-secondary-pop rounded-[50px]';

const LoginOrSignUpButton = () => {
  const queryClient = useQueryClient();

  const loginOrCreateUser = useLoginOrCreateUser({
    onLogin: () =>
      queryClient.invalidateQueries({ queryKey: [ACTIVE_USER_QUERY_KEY] }),
  });

  return (
    <button onClick={loginOrCreateUser} className={btnClass}>
      <Mono className="text-white uppercase">Checkout (login)</Mono>
    </button>
  );
};

export const GetUsdcButton = () => {
  return (
    <button className={btnClass}>
      <Mono className="text-white uppercase">Get USDC?</Mono>
    </button>
  );
};

export const PayButton = () => {
  const wallet = useConnectedWallet();

  const { data: cart, error } = useCartInSliceFormat({
    buyerAddress: wallet?.address,
  });
  if (!cart || !wallet) return null;

  const purchase = async () =>
    sliceKit.payProducts({
      account: wallet.address,
      cart,
    });

  return (
    <button onClick={purchase} className={btnClass}>
      <Mono className="text-white uppercase">Checkout</Mono>
    </button>
  );
};

type SliceCheckoutStep =
  | 'initializing'
  | 'signup'
  | 'login'
  | 'get-usdc'
  | 'pay';

const useDetermineCheckoutStep = (): {
  step: SliceCheckoutStep;
  button: JSX.Element | null;
} => {
  const { authenticated, ready: privyReady } = usePrivy();
  const { wallets } = useWallets();
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useActiveUser();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useUSDCBalance();
  const { data: cart, isLoading: isCartLoading, error: cartError } = useCart();

  const logEverything = false;
  if (logEverything)
    console.table({
      user,
      privyReady,
      wallets,
      balance,
      cart,
      isBalanceLoading,
      isCartLoading,
      isUserLoading,
      balanceError,
      cartError,
      userError,
    });

  // (shouldn't happen)
  if (!privyReady || isUserLoading || !user || !cart) {
    return {
      step: 'initializing',
      button: null,
    };
  }

  if (user.__type === 'session')
    return { step: 'signup', button: <LoginOrSignUpButton /> };

  if ((user.__type === 'user' && !authenticated) || wallets.length === 0)
    return { step: 'login', button: <LoginOrSignUpButton /> };

  if (isBalanceLoading || !balance)
    return {
      step: 'initializing',
      button: null,
    };

  const total = getOrderSummary(cart);
  const hasSufficientFunds = balance >= total.total.raw;
  if (hasSufficientFunds) return { step: 'pay', button: <PayButton /> };
  else return { step: 'get-usdc', button: <GetUsdcButton /> };
};

export const SliceCheckoutButton = () => {
  const step = useDetermineCheckoutStep();

  return (
    <div
      className={cn(
        'bg-secondary-pop h-14 w-full flex flex-col justify-center rounded-[50px]',
        {
          'animate-pulse': step.step === 'initializing' || step.button === null,
        },
      )}
    >
      {step.button}
    </div>
  );
};
