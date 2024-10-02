import drip from '@/assets/drip.jpg';
import { HomePageHeader } from '@/components/home-page/header';
import { NearMeList, ShopList } from '@/components/home-page/shop-list';
import { WelcomeDialog } from '@/components/home-page/welcome-popup';
import { Skeleton } from '@/components/ui/skeleton';
import { Shop } from '@/data-model/shop/ShopType';
import { rehydrateData } from '@/lib/utils';
import ShopService from '@/services/ShopService';
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

export const getStaticProps: GetStaticProps<{
  dehydratedState: DehydratedState;
}> = async () => {
  const shops = await ShopService.findAll({ rehydrate: false });

  const queryClient = new QueryClient();
  await queryClient.setQueryData(['shop'], shops);

  return {
    props: {
      shops,
      dehydratedState: dehydrate(queryClient),
    },
  };
};

const LazyMap = dynamic(() => import('../components/map/map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[245px]" />,
});

export default function Home({
  shops,
  dehydratedState: _dehydratedState,
}: {
  shops: Shop[];
  dehydratedState: DehydratedState;
}) {
  // const all = usePrivy();
  // const wallets = useWallets();
  // // const acct = useAccount();
  const rehydratedShops = useMemo(() => rehydrateData<Shop[]>(shops), [shops]);

  const dehydratedState = useMemo(
    () => rehydrateData(_dehydratedState),
    [_dehydratedState],
  );
  // useEffect(() => {
  //   const acct = getAccount(sliceKit.wagmiConfig);
  //   console.log(acct);
  // }, []);

  // console.log(all);
  // console.log(wallets);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="flex flex-col gap-5 pb-32">
        <HomePageHeader />
        <LazyMap shops={rehydratedShops} />

        <NearMeList />

        <ShopList title="All Cafes" shops={rehydratedShops} isLoading={false} />

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
