import {
  Body,
  Drip,
  Label1,
  Label2,
  Label3,
  Mono,
  Title2,
} from '@/components/ui/typography';
import { AsCheckoutSlide } from '../checkout-slides';
import grandma from '@/assets/grandma.png';
import Image from 'next/image';
import { CTAButton } from '@/components/ui/button';
import { useCheckoutContext } from '../checkout-context';
import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { useCarousel } from '@/components/ui/carousel';
import { ACTIVE_USER_QUERY_KEY } from '@/queries/UserQuery';
import { usePrivy } from '@privy-io/react-auth';

export function shouldGoToWelcomeSlide(step: string) {
  return step === 'login' || step === 'signup' || step === 'connect';
}

const ConnectButton = () => {
  const { step } = useCheckoutContext();
  const { connectWallet } = usePrivy();
  const { current: initialStep } = useRef(step);
  const { scrollNext } = useCarousel();

  const queryClient = useQueryClient();

  const loginOrCreateUser = useLoginOrCreateUser({
    onLogin: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVE_USER_QUERY_KEY] });
      scrollNext();
    },
  });

  const action =
    initialStep === 'connect'
      ? connectWallet
      : initialStep === 'login' || initialStep === 'signup'
        ? loginOrCreateUser
        : 'ERROR';

  return (
    <CTAButton onClick={action !== 'ERROR' ? action : () => {}}>
      {action !== 'ERROR' ? 'Connect Wallet' : 'Login'}
    </CTAButton>
  );
};

const WelcomeSlide = () => {
  return (
    <div className="h-full bg-background flex flex-col items-center justify-center px-6 gap-4 py-6">
      <div className="flex-grow" />
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

      <ConnectButton />
    </div>
  );
};

export default function () {
  return (
    <AsCheckoutSlide>
      <WelcomeSlide />
    </AsCheckoutSlide>
  );
}
function useCheckout(): { step: any; setStep: any } {
  throw new Error('Function not implemented.');
}
