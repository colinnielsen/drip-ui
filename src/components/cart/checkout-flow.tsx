import { PrivyProvider } from '../providers.tsx/PrivyProvider';
import { SliceCheckoutButton } from './slice-checkout';

export default function () {
  return (
    <PrivyProvider>
      <SliceCheckoutButton />
    </PrivyProvider>
  );
}
