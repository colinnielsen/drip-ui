import { Divider } from '@/components/ui/divider';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Drip } from '@/components/ui/typography';
import { WalletActions } from '@/components/wallet/wallet-actions';
import { WalletCard } from '@/components/wallet/wallet-card';

export default function WalletPage() {
  return (
    <PageWrapper>
      <PageHeader title="Wallet" />

      <div className="px-6 pt-6">
        <WalletCard />
        <WalletActions />
      </div>
      <div className="px-6 py-3">
        <Drip className="text-2xl">Rewards</Drip>
      </div>
      <Divider />
    </PageWrapper>
  );
}
