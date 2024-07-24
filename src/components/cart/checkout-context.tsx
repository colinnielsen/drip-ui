import { getOrderSummary } from '@/data-model/order/OrderDTO';
import { useConnectedWallet, useUSDCBalance } from '@/queries/EthereumQuery';
import { useCart } from '@/queries/OrderQuery';
import { useActiveUser } from '@/queries/UserQuery';
import { usePrivy } from '@privy-io/react-auth';
import { createContext, useContext, useEffect } from 'react';

// const SLIDE_MAP = {
//   initializing: 1,
//   signup: 2,
//   login: 2,
//   connect: 2,
//   pay: 5,
// };

export type SliceCheckoutStep =
  | 'initializing'
  | 'signup'
  | 'login'
  | 'connect'
  | 'get-usdc'
  | 'pay';

type CheckoutCtx = {
  step: SliceCheckoutStep;
  //   nextSlide: (() => void) | null;
};

const initial = {
  step: 'initializing' as const,
  //   nextSlide: null,
};

export const CheckoutContext = createContext<CheckoutCtx>(initial);

export const useCheckoutContext = () => {
  const context = useContext(CheckoutContext);

  if (!context)
    throw new Error('useCheckout must be used within a CheckoutProvider');

  return context;
};

const useDetermineCheckoutStep = (): {
  step: SliceCheckoutStep;
  //   button: JSX.Element | null;
} => {
  const { authenticated, ready: privyReady } = usePrivy();
  const wallet = useConnectedWallet();
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

  // console.log({
  //   user,
  //   privyReady,
  //   balance,
  //   cart,
  //   isBalanceLoading,
  //   isCartLoading,
  //   isUserLoading,
  //   balanceError,
  //   cartError,
  //   userError,
  // });
  // (shouldn't happen)
  if (!privyReady || isUserLoading || !user || !cart)
    return {
      step: 'initializing',
    };

  if (user.__type === 'session') return { step: 'signup' };

  if (user.__type === 'user' && !authenticated) return { step: 'login' };

  if (wallet === null) return { step: 'connect' };
  if (isBalanceLoading || balance === undefined)
    return {
      step: 'initializing',
    };

  const total = getOrderSummary(cart);
  const hasSufficientFunds = balance >= total.total.raw;
  if (hasSufficientFunds) return { step: 'pay' };
  else return { step: 'get-usdc' };
};

export const CheckoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { step } = useDetermineCheckoutStep();
  useEffect(() => {
    console.log({ step });
  }, [step]);

  //   const nextSlide = useCallback(
  //     (() => {
  //       console.log('redefining');
  //       if (step === 'initializing') return null;
  //       if (step === 'get-usdc') return null;
  //       if(step === '')
  //       return () => {
  //         jumpToSlide(SLIDE_MAP[step]);
  //       };
  //     })(),
  //     [step, jumpToSlide],
  //   );

  return (
    <CheckoutContext.Provider value={{ step }}>
      {children}
    </CheckoutContext.Provider>
  );
};
