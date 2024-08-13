import { Order } from '@/data-model/order/OrderType';
import { useSecondsSinceMount } from '@/lib/hooks/utility-hooks';
import { axiosFetcher } from '@/lib/utils';
import { useUSDCBalance, useWalletAddress } from '@/queries/EthereumQuery';
import {
  ORDERS_QUERY_KEY,
  useRecentCart,
  useCartId,
  useCartSummary,
} from '@/queries/OrderQuery';
import { useUser } from '@/queries/UserQuery';
import { usePrivy } from '@privy-io/react-auth';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { useGoToSlide, useSlideInView } from '../ui/carousel';

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

type PaymentStep = 'idle' | 'awaiting-confirmation' | 'success' | 'error';

type CheckoutCtx = {
  step: SliceCheckoutStep;
  paymentStep: PaymentStep;
  setPaymentStep: (step: PaymentStep) => void;
};

const initial = {
  step: 'initializing' as const,
  paymentStep: 'idle' as const,
  setPaymentStep: () => {},
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
  const slideInView = useSlideInView();
  const { authenticated, ready: privyReady } = usePrivy();
  const wallet = useWalletAddress();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: cart } = useRecentCart();
  const { data: balance, isLoading: isBalanceLoading } = useUSDCBalance({
    pollingInterval:
      slideInView === 0 && cart?.status === '1-pending' ? 6_000 : undefined,
  });

  const cartSummary = useCartSummary();

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
  if (!privyReady || isUserLoading || !user || !cart || !cartSummary)
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

  const hasSufficientFunds = balance.gte(cartSummary.total.usdc);
  if (hasSufficientFunds) return { step: 'pay' };
  else return { step: 'get-usdc' };
};

const useShouldPollForCartStatus = (
  checkoutStep: SliceCheckoutStep,
  paymentStep: PaymentStep,
) => {
  const { data: cart } = useRecentCart();
  const cartId = cart?.id;
  const slideInView = useSlideInView();
  const secondsSinceMount = useSecondsSinceMount();
  const [secondsWhenPaid, setSecondsWhenPaid] = useState(0);
  const waitforatleastseconds = 4;

  const shouldPoll =
    cartId &&
    slideInView === 1 &&
    !!secondsWhenPaid &&
    secondsWhenPaid + waitforatleastseconds < secondsSinceMount;
  console.log({
    slideInView,
    shouldPoll,
    secondsWhenPaid,
    secondsSinceMount,
    paymentStep,
    waitforatleastseconds,
  });
  useEffect(() => {
    if (!cartId || slideInView !== 1 || paymentStep !== 'success') return;

    if (secondsWhenPaid === 0) setSecondsWhenPaid(secondsSinceMount);
  }, [
    cartId,
    checkoutStep,
    paymentStep,
    slideInView,
    cart?.status,
    secondsWhenPaid,
    secondsSinceMount,
  ]);

  return shouldPoll;
};

export const CheckoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { step } = useDetermineCheckoutStep();
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle');
  const cartId = useCartId();
  const queryClient = useQueryClient();
  const goToSlide = useGoToSlide();

  const shouldPoll = useShouldPollForCartStatus(step, paymentStep);

  useQuery({
    queryKey: ['cart-status', cartId],
    queryFn: () =>
      axiosFetcher<Order>(`/api/orders/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: { orderId: cartId },
      }).then(data => {
        if (data.status === '3-in-progress') goToSlide?.(2);
        return queryClient.setQueryData(
          [ORDERS_QUERY_KEY, data.user],
          (orders: Order[]) => orders.map(o => (o.id === data.id ? data : o)),
        );
      }),
    enabled: shouldPoll && !!cartId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    console.log({ checkoutStep: step });
  }, [step]);

  useEffect(() => {
    console.log({ paymentStep });
  }, [paymentStep]);

  return (
    <CheckoutContext.Provider value={{ step, paymentStep, setPaymentStep }}>
      {children}
    </CheckoutContext.Provider>
  );
};
