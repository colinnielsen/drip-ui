import { FarmerDetails, FarmerHeader } from '@/components/FarmerHeader';
import { database } from '@/infras/database';
import { useFarmer } from '@/queries/FarmerQuery';
import { UUID } from 'crypto';
import { GetStaticPaths } from 'next';

// Things left to do here:
// TODO Add tip panel
// TODO Add messages (probably worth using an external service for this)
// TODO Add activity log data

//
//// STATIC SITE GENERATION
//

export const getStaticPaths = (async () => {
  return {
    paths: (await database.farmers.findAll()).map(farmer => ({
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
  const { isLoading, data: farmer, error } = useFarmer(farmerId as UUID);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!farmer) return <div>Farmer not found</div>;

  return (
    <main className="flex flex-col min-h-screen mb-32">
      <FarmerHeader {...farmer} />
      <div className="p-5 px-6 flex flex-col gap-5">
        <FarmerDetails {...farmer} />
        <div className="py-12 w-full flex justify-center items-center bg-neutral-500 rounded-3xl"></div>
      </div>
    </main>
  );
}
