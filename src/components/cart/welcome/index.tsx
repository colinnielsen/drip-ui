import grandma from '@/assets/grandma.png';
import { CTAButton } from '@/components/ui/button';
import { Drip, Mono, Title2 } from '@/components/ui/typography';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { ORDERS_QUERY_KEY } from '@/queries/OrderQuery';
import { ACTIVE_USER_QUERY_KEY, useUser } from '@/queries/UserQuery';
import { usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useCheckoutContext } from '../context';

export function shouldGoToWelcomeSlide(step: string) {
  return step === 'login' || step === 'signup' || step === 'connect';
}

export const ConnectButton = ({ onClose }: { onClose?: () => void }) => {
  const { step } = useCheckoutContext();
  const { connectWallet } = usePrivy();
  const { current: initialStep } = useRef(step);
  const { data: user } = useUser();

  const queryClient = useQueryClient();

  const loginOrCreateUser = useLoginOrCreateUser({
    onLogin: data => {
      queryClient.setQueryData([ACTIVE_USER_QUERY_KEY], data);
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY, data.id],
      });
      onClose?.();
    },
  });

  const action =
    initialStep === 'connect'
      ? () =>
          connectWallet({
            suggestedAddress:
              user?.__type === 'user' ? user.wallet.address : undefined,
          })
      : initialStep === 'login' || initialStep === 'signup'
        ? loginOrCreateUser
        : 'ERROR';

  return (
    <CTAButton
      onClick={
        action !== 'ERROR'
          ? e => {
              e.stopPropagation();
              e.preventDefault();
              action();
            }
          : () => {}
      }
      type="submit"
    >
      {action !== 'ERROR' ? 'Connect Wallet' : 'Login'}
    </CTAButton>
  );
};

export default function WelcomeScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="h-full bg-background flex flex-col items-center justify-center px-6 gap-4 py-6">
      <div className="flex-grow" />
      {/* <div className="flex items-center justify-center gap-x-1 mb-10">
        <Drip>Drip</Drip>
        <Mono className="bg-slate-400 text-white px-2 py-1 rounded-md text-xs mt-2">
          beta
        </Mono>
      </div> */}
      <Image src={grandma} alt="Grandma" width={200} height={200} />
      <Title2 as="p" className="text-center">
        One day, we want your grandma to be able to use{' '}
        <Drip as="span" className="text-[length:inherit]">
          Drip
        </Drip>
        .
        <br />
        <br />
        ...but in the meantime
      </Title2>
      <div className="flex-grow" />
      <Mono className="text-center">
        connect your web3 wallet to continue 👇
      </Mono>
      <ConnectButton onClose={onClose} />
    </div>
  );
}
