import { FarmerBio } from '@/components/farmer-page.tsx/bio';
import { FarmerCampaigns } from '@/components/farmer-page.tsx/campaigns';
import { FarmerHeader } from '@/components/farmer-page.tsx/header';
import { FarmerMessageBoard } from '@/components/farmer-page.tsx/message-board';
import { FarmerSection } from '@/components/farmer-page.tsx/section';
import { Divider } from '@/components/ui/divider';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { sqlDatabase } from '@/infras/database';
import { useFarmer } from '@/queries/FarmerQuery';
import { UUID } from 'crypto';
import { GetStaticPaths } from 'next';

//
//// STATIC SITE GENERATION
//

export const getStaticPaths = (async () => {
  const res = await sqlDatabase.farmers.findAll();
  return {
    paths: res.map(farmer => ({
      params: { farmerId: farmer.id },
    })),
    fallback: true,
  };
}) satisfies GetStaticPaths;

export async function getStaticProps({
  params,
}: {
  params: { farmerId: string };
}) {
  if (!params.farmerId)
    return {
      notFound: true,
    };
  else
    return {
      props: {
        farmerId: params.farmerId,
      },
    };
}

//
//// DYNAMIC RENDERING
//
export default function FarmerPage({ farmerId }: { farmerId: string }) {
  const { data: farmer, error } = useFarmer(farmerId as UUID);

  if (error) return <div>Error: {error.message}</div>;
  if (farmer === null) return <div>Farmer not found</div>;

  return (
    <PageWrapper>
      <PageHeader />
      <FarmerHeader {...{ farmer: farmer || 'loading' }} />
      <div className="h-8" />

      {farmer?.campaigns && (
        <>
          <FarmerSection title="Campaigns">
            <FarmerCampaigns {...{ farmer }} />
          </FarmerSection>
          <Divider />
        </>
      )}

      {/* {farmer?.posts && (
        <>
          <FarmerSection title="Updates">
            <FarmerPosts {...{ farmer }} />
          </FarmerSection>
          <Divider />
        </>
      )} */}

      <FarmerSection title="About the farm">
        <FarmerBio {...{ farmer: farmer || 'loading' }} />
      </FarmerSection>
      <Divider />

      {farmer && (
        <FarmerSection title="Message board">
          <FarmerMessageBoard {...{ farmer }} />
        </FarmerSection>
      )}

      {/* {farmer && (
        <FarmerSection title="Activity">
          <FarmerActivity {...{ farmer }} />
        </FarmerSection>
      )} */}
    </PageWrapper>
  );
}
