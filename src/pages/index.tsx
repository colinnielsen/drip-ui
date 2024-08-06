import drip from '@/assets/drip.jpg';
import { HomePageHeader } from '@/components/home-page/header';
import { ShopList } from '@/components/home-page/shop-list';
import { WelcomeDialog } from '@/components/home-page/welcome-popup';
import { Shop } from '@/data-model/shop/ShopType';
import { sqlDatabase } from '@/infras/database';
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { GetStaticProps } from 'next';
import Head from 'next/head';

export const getStaticProps: GetStaticProps<{
  dehydratedState: DehydratedState;
}> = async () => {
  const shops = await sqlDatabase.shops.findAll();

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['shops'],
    queryFn: () => shops,
  });

  return {
    props: {
      shops,
      dehydratedState: dehydrate(queryClient),
    },
  };
};

export default function Home({
  shops,
  dehydratedState,
}: {
  shops: Shop[];
  dehydratedState: DehydratedState;
}) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="flex flex-col gap-5 pb-32">
        <Head>
          <title>Drip</title>
          <meta
            name="viewport"
            content="width=device-width, user-scalable=no"
          />
        </Head>
        <HomePageHeader />
        {/* <div className="w-screen max-h-64 overflow-hidden">
        <Image src={map} alt="coffee" />
      </div> */}
        {/* 
        {error ? (
          <div className="p-4 text-red-500">Error: {error.message}</div>
        ) : (
          )} */}

        <ShopList
          title="Participating shops"
          shops={shops ?? []}
          isLoading={false}
        />

        <WelcomeDialog
          title="Welcome to Drip"
          image={drip}
          imageAlt="coffee"
          description="Drip is a coffee app designed to reward growers and local farms. For every coffee you buy with USDC, the more growers earn."
          buttonText="let's go"
          defaultOpen={false}
        />
      </div>
    </HydrationBoundary>
  );
}
