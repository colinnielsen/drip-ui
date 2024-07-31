import { getOrderSummary } from '@/data-model/order/OrderDTO';
import { useSecondsSinceMount } from '@/lib/hooks/utility-hooks';
import { useConnectedWallet, useUSDCBalance } from '@/queries/EthereumQuery';
import { ORDERS_QUERY_KEY, useCart, useCartId } from '@/queries/OrderQuery';
import { useUser } from '@/queries/UserQuery';
import { usePrivy } from '@privy-io/react-auth';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { useGoToSlide, useSlideInView } from '../ui/carousel';
import { axiosFetcher } from '@/lib/utils';
import { Order } from '@/data-model/order/OrderType';

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
  const { authenticated, ready: privyReady } = usePrivy();
  const wallet = useConnectedWallet();
  const { data: user, isLoading: isUserLoading, error: userError } = useUser();
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

const useShouldPollForCartStatus = (
  checkoutStep: SliceCheckoutStep,
  paymentStep: PaymentStep,
) => {
  const { data: cart } = useCart();
  const cartId = cart?.id;
  const slideInView = useSlideInView();
  const secondsSinceMount = useSecondsSinceMount();
  const [secondsWhenPaid, setSecondsWhenPaid] = useState(0);
  const waitforatleastseconds = 4;

  const shouldPoll =
    cartId &&
    slideInView === 1 &&
    (cart.status === 'submitting' || cart.status === 'in-progress') &&
    !!secondsWhenPaid &&
    secondsWhenPaid + waitforatleastseconds < secondsSinceMount;

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
    queryFn: cartId
      ? () =>
          axiosFetcher<Order>(`/api/orders/status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            data: { orderId: cartId },
          }).then(data => {
            if (data.status === 'in-progress') goToSlide?.(2);
            return queryClient.setQueryData(
              [ORDERS_QUERY_KEY, data.user],
              (orders: Order[]) =>
                orders.map(o => (o.id === data.id ? data : o)),
            );
          })
      : skipToken,
    enabled: shouldPoll && !!cartId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    console.log({ checkoutStep: step });
  }, [step]);

  useEffect(() => {
    console.log({ paymentStep });
  }, [paymentStep]);

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
    <CheckoutContext.Provider value={{ step, paymentStep, setPaymentStep }}>
      {children}
    </CheckoutContext.Provider>
  );
};
