import { HistoricalOrderList } from '@/components/profile-page/historical-order-list';
import { ProfileInfo, ResetFooter } from '@/components/profile-page/profile';
import { Divider } from '@/components/ui/divider';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';

const Me = () => {
  return (
    <PageWrapper>
      <PageHeader title="Profile" />

      <ProfileInfo />

      <div className="h-4" />

      <HistoricalOrderList />

      <Divider />

      <ResetFooter />
    </PageWrapper>
  );
};

export default Me;
