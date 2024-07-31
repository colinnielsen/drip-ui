import {
  getOrderSummary,
  hasPaymentConfirmed,
  isPaidOrder,
} from '@/data-model/order/OrderDTO';
import { useSecondsSinceMount } from '@/lib/hooks/utility-hooks';
import { useConnectedWallet, useUSDCBalance } from '@/queries/EthereumQuery';
import { useCart, useCartId, useCheckOrderStatus } from '@/queries/OrderQuery';
import { useUser } from '@/queries/UserQuery';
import { usePrivy } from '@privy-io/react-auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNextSlide, useSlideInView } from '../ui/carousel';

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

// const StatusListener = ({ order }: { order: Order }) => {
//   const slideInView = useSlideInView();
//   const seconds = useSecondsSinceMount();
//   const isInView = slideInView === 1;

//   useEffect(() => {
//     const interval = setInterval(() => {
//       checkStatus(order.id).then(newOrder => {
//         if (isPaidOrder(newOrder)) {
//           setComplete(true);
//           clearInterval(interval);
//         }
//       });
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (seconds > 7 && complete && !hasScrolled && isInView) {
//       goToSlide?.(2);
//       setHasScrolled(true);
//     }
//   }, [seconds, complete, hasScrolled, isInView]);

//   return null;
// };

const useShouldPollForCartStatus = (
  checkoutStep: SliceCheckoutStep,
  paymentStep: PaymentStep,
) => {
  const { data: cart } = useCart();
  const cartId = cart?.id;
  const slideInView = useSlideInView();
  const isPaid = !!cart && isPaidOrder(cart);
  const secondsSinceMount = useSecondsSinceMount();
  const [secondsWhenPaid, setSecondsWhenPaid] = useState(0);
  const waitforatleastseconds = 4;

  const shouldPoll =
    checkoutStep === 'pay' &&
    paymentStep === 'success' &&
    cartId &&
    slideInView === 1 &&
    isPaid &&
    secondsWhenPaid + waitforatleastseconds < secondsSinceMount;

  useEffect(() => {
    if (checkoutStep !== 'pay' || paymentStep !== 'success') return;
    if (!cartId || slideInView !== 1 || !isPaid) return;

    if (secondsWhenPaid === 0) setSecondsWhenPaid(secondsSinceMount);
  }, [
    cartId,
    checkoutStep,
    paymentStep,
    slideInView,
    isPaid,
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
  const nextSlide = useNextSlide();

  const shouldPoll = useShouldPollForCartStatus(step, paymentStep);
  const { mutateAsync: checkStatus } = useCheckOrderStatus();

  useEffect(() => {
    console.log({ shouldPoll });
    if (shouldPoll && cartId) {
      const interval = setInterval(() => {
        checkStatus(cartId).then(newOrder => {
          if (hasPaymentConfirmed(newOrder)) nextSlide?.();
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [shouldPoll, cartId]);

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
