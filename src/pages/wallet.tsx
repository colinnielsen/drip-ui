import { Divider } from '@/components/ui/divider';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Title1 } from '@/components/ui/typography';
import { RewardSection } from '@/components/wallet/rewards-section';
import { WalletActions } from '@/components/wallet/wallet-actions';
import { WalletCard } from '@/components/wallet/wallet-card';

export default function WalletPage() {
  return (
    <PageWrapper>
      <PageHeader title="Wallet" />

      <div className="px-6 pt-6 w-full flex items-center flex-col">
        <WalletCard />
        <WalletActions />
      </div>
      <div className="px-6 py-3">
        <Title1 className="text-2xl">Rewards</Title1>
      </div>
      <Divider />
      <RewardSection />
    </PageWrapper>
  );
}
