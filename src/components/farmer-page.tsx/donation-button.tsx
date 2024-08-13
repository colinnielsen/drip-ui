import { USDC } from '@/data-model/_common/currency/USDC';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { useUSDCBalance, useWalletClient } from '@/queries/EthereumQuery';
import { useDonate } from '@/queries/FarmerQuery';
import { useConnectWallet } from '@privy-io/react-auth';
import { useState } from 'react';
import { CTAButton, LoadingCTAButton } from '../ui/button';
import { Divider } from '../ui/divider';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { Title1 } from '../ui/typography';
import { USDCInput } from '../ui/usdc-input';

const SendButton = ({
  farmer,
  amount,
  onComplete,
}: {
  farmer: Farmer;
  amount: USDC;
  onComplete: () => void;
}) => {
  const wallet = useWalletClient();
  const { connectWallet } = useConnectWallet();
  const { data: usdcBalance } = useUSDCBalance({ pollingInterval: 6_000 });
  const { mutateAsync: donate, isPending: sending } = useDonate();

  if (!wallet)
    return (
      <CTAButton onClick={() => connectWallet()}>Connect Wallet</CTAButton>
    );

  if (!usdcBalance) return <LoadingCTAButton />;

  if (usdcBalance.lt(amount))
    return <CTAButton disabled>Insufficient balance</CTAButton>;

  return (
    <CTAButton
      disabled={amount.eq(USDC.ZERO) || sending}
      onClick={() => donate({ farmer, amount }).then(onComplete)}
      isLoading={sending}
    >
      send
    </CTAButton>
  );
};

export const DonationButton = ({ farmer }: { farmer: Farmer }) => {
  const [amount, setAmount] = useState(USDC.ZERO);
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <CTAButton variant="cta-small" className="grow">
          support me
        </CTAButton>
      </DrawerTrigger>

      <DrawerContent className="flex flex-col gap-4 w-full p-0">
        <DrawerTitle className="pt-4 px-6 grow text-center">
          <Title1>Support {farmer.name.split(' ')[0]}</Title1>
        </DrawerTitle>
        <USDCInput amount={amount} setAmount={setAmount} />
        <Divider />
        <DrawerFooter className="p-6 pt-0">
          <SendButton
            farmer={farmer}
            amount={amount}
            onComplete={() => setOpen(false)}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
