import { FarmerBio } from '@/components/farmer-page.tsx/bio';
import { FarmerCampaigns } from '@/components/farmer-page.tsx/campaigns';
import { FarmerHeader } from '@/components/farmer-page.tsx/header';
import { FarmerMessageBoard } from '@/components/farmer-page.tsx/message-board';
import { FarmerPosts } from '@/components/farmer-page.tsx/posts';
import { FarmerSection } from '@/components/farmer-page.tsx/section';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { isUUID } from '@/lib/utils';
import FarmerService from '@/services/FarmerService';
import { GetStaticPaths } from 'next';

//
//// STATIC SITE GENERATION
//
export const getStaticPaths = (async () => {
  const res = await FarmerService.findAll();
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
  if (!params.farmerId || !isUUID(params.farmerId))
    return {
      notFound: true,
    };

  const farmer = await FarmerService.findById(params.farmerId);
  if (!farmer)
    return {
      notFound: true,
    };
  else
    return {
      props: {
        farmer,
      },
    };
}

//
//// DYNAMIC RENDERING
//
export default function FarmerPage({ farmer }: { farmer: Farmer }) {
  return (
    <PageWrapper>
      <PageHeader />
      <FarmerHeader {...{ farmer: farmer || 'loading' }} />
      <div className="h-8" />

      <div className="flex flex-col divide-y divide-light-gray">
        {farmer?.campaigns && (
          <FarmerSection title="Campaigns">
            <FarmerCampaigns {...{ farmer }} />
          </FarmerSection>
        )}

        {!!farmer?.posts.length && (
          <FarmerSection title="Updates">
            <FarmerPosts {...{ farmer }} />
          </FarmerSection>
        )}

        <FarmerSection title="About the farm">
          <FarmerBio {...{ farmer: farmer || 'loading' }} />
        </FarmerSection>

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
      </div>
    </PageWrapper>
  );
}
