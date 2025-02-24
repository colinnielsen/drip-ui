import { USDC } from '@/data-model/_common/currency/USDC';
import { Farmer } from '@/data-model/farmer/FarmerType';
import {
  useUSDCBalance,
  usePreferredWalletClient,
} from '@/queries/EthereumQuery';
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
import { Label1, Title1 } from '../ui/typography';
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
  const wallet = usePreferredWalletClient();
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
      onClick={() =>
        donate({ farmer, amount }).then(
          donationMessage => donationMessage && onComplete(),
        )
      }
      isLoading={sending}
    >
      send
    </CTAButton>
  );
};

export const DonationButton = ({ farmer }: { farmer: Farmer }) => {
  const [amount, setAmount] = useState(USDC.ZERO);
  const [open, setOpen] = useState(false);
  const [donationComplete, setDonationComplete] = useState(false);

  const farmerName = farmer.name.split(' ')[0];
  return (
    <Drawer
      open={open}
      onOpenChange={open => {
        setOpen(open);
        if (donationComplete) setAmount(USDC.ZERO);
        if (!open) setDonationComplete(false);
      }}
    >
      <DrawerTrigger asChild>
        <CTAButton variant="cta-small" className="grow">
          support me
        </CTAButton>
      </DrawerTrigger>

      <DrawerContent className="flex flex-col gap-4 w-full p-0">
        <DrawerTitle className="pt-4 px-6 grow text-center">
          <Title1>
            {donationComplete
              ? `Thanks for supporting ${farmerName}!`
              : `Support ${farmerName}`}
          </Title1>
        </DrawerTitle>
        {donationComplete ? (
          <Label1 className="text-primary-gray px-6 text-center py-2">
            Your donation goes directly to {farmerName}&apos;s farm
          </Label1>
        ) : (
          <USDCInput amount={amount} setAmount={setAmount} />
        )}

        <Divider />
        <DrawerFooter className="p-6 pt-0 pb-">
          {donationComplete ? (
            <CTAButton onClick={() => setOpen(false)}>done</CTAButton>
          ) : (
            <SendButton
              farmer={farmer}
              amount={amount}
              onComplete={() => {
                setDonationComplete(true);
              }}
            />
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
