import { getOrderSummary } from '@/data-model/order/OrderDTO';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { cn } from '@/lib/utils';
import { useConnectedWallet, useUSDCBalance } from '@/queries/EthereumQuery';
import { useCart, useCartInSliceFormat } from '@/queries/OrderQuery';
import { ACTIVE_USER_QUERY_KEY, useActiveUser } from '@/queries/UserQuery';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { sliceKit } from '../../../lib/slice';
import { Mono } from '../../ui/typography';
import { CTAButton } from '@/components/ui/button';

// export const PayButton = () => {
//   const wallet = useConnectedWallet();

//   const { data: cart, error } = useCartInSliceFormat({
//     buyerAddress: wallet?.address,
//   });
//   if (!cart || !wallet) return null;

//   const purchase = async () =>
//     sliceKit.payProducts({
//       account: wallet.address,
//       cart,
//     });

//   return (
//     <button onClick={purchase} className={btnClass}>
//       <Mono className="text-white uppercase">Checkout</Mono>
//     </button>
//   );
// };

export const SliceCheckoutButton = () => {
  // const step = useDetermineCheckoutStep();

  return (
    <>
      {/* <div
        className={cn(
          'bg-secondary-pop h-14 w-full flex flex-col justify-center rounded-[50px]',
          {
            'animate-pulse':
              step.step === 'initializing' || step.button === null,
          },
        )}
      >
        {step.button}
      </div>
      {step.step} */}
    </>
  );
};
