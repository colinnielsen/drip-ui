import { Farmer } from '@/data-model/farmer/FarmerType';
import { useState } from 'react';
import { CTAButton } from '../ui/button';
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

const FarmerTipAmount = ({ farmer }: { farmer: Farmer }) => {
  const [amount, setAmount] = useState(0);
  return <USDCInput amount={amount} setAmount={setAmount} />;
};

export const DonationButton = ({ farmer }: { farmer: Farmer }) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <CTAButton variant="cta-small" className="grow">
          support me
        </CTAButton>
      </DrawerTrigger>

      <DrawerContent className="flex flex-col gap-4 w-full p-0">
        <DrawerTitle className="pt-4 px-6 grow text-center">
          <Title1>Support {farmer.name.split(' ')[0]}</Title1>
        </DrawerTitle>
        <FarmerTipAmount farmer={farmer} />
        <Divider />
        <DrawerFooter className="p-6 pt-0">
          <CTAButton>Send</CTAButton>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
