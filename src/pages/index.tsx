import drip from '@/assets/drip.jpg';
import { HomePageHeader } from '@/components/home-page/header';
import { ShopList } from '@/components/home-page/shop-list';
import { WelcomeDialog } from '@/components/home-page/welcome-popup';
import { Shop } from '@/data-model/shop/ShopType';
import { sqlDatabase } from '@/infras/database';
import { rehydrateData } from '@/lib/utils';
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useMemo, useRef } from 'react';

export const getStaticProps: GetStaticProps<{
  dehydratedState: DehydratedState;
}> = async () => {
  const shops = await sqlDatabase.shops.findAll({ rehydrate: false });

  const queryClient = new QueryClient();
  await queryClient.setQueryData(['shop'], shops);

  return {
    props: {
      shops,
      dehydratedState: dehydrate(queryClient),
    },
  };
};

export default function Home({
  shops,
  dehydratedState: _dehydratedState,
}: {
  shops: Shop[];
  dehydratedState: DehydratedState;
}) {
  const rehydratedShops = useMemo(() => rehydrateData<Shop[]>(shops), [shops]);

  const dehydratedState = useMemo(
    () => rehydrateData(_dehydratedState),
    [_dehydratedState],
  );

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
          shops={rehydratedShops}
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
