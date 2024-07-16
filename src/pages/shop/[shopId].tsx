import FarmerCard from '@/components/shop-page/farmer-intro-card';
import { ItemList } from '@/components/shop-page/item-list';
import { ShopHeader, ShopHeaderDetails } from '@/components/shop-page/header';
import { Shop } from '@/data-model/shop/ShopType';
import { STATIC_SHOP_DATA } from '@/infras/static-data/StaticShopData';
import { farmerQuery } from '@/queries/FarmerQuery';
import { shopQuery, useShop } from '@/queries/ShopQuery';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { UUID } from 'crypto';
import { GetStaticPaths, GetStaticProps } from 'next/types';

///
///// STATIC SITE GENERATION
///

const STATIC_PAGE_DATA = STATIC_SHOP_DATA.map(c => ({
  __type: c.__type,
  id: c.id,
  label: c.label,
  backgroundImage: c.backgroundImage,
  logo: c.logo,
  location: 'location' in c ? c.location : null,
}));

export type StaticPageData = (typeof STATIC_PAGE_DATA)[number];

export const getStaticPaths: GetStaticPaths<{ shopId: UUID }> = () => {
  const paths = STATIC_PAGE_DATA.map(d => ({
    params: { shopId: d.id },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<{
  dehydratedState: DehydratedState;
}> = async ({ params }) => {
  if (!params?.shopId) throw Error('cannot find params');

  const shop = STATIC_PAGE_DATA.find(l => l.id === params.shopId)!;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(shopQuery(params.shopId as UUID));
  const data: Shop | undefined = queryClient.getQueryData([
    'shop',
    params.shopId as UUID,
  ]);

  const [selectedFarmer] = data?.farmerAllocations || [null];
  if (selectedFarmer)
    await queryClient.prefetchQuery(farmerQuery(selectedFarmer.farmer));

  if (!shop) return { notFound: true };
  else
    return {
      props: {
        ...shop,
        dehydratedState: dehydrate(queryClient),
      },
    };
};

//
/// DYNAMIC PAGE
//
function DynamicShopPage(staticShop: StaticPageData) {
  const { data: shop, error, isLoading } = useShop(staticShop.id);

  // return <FarmerLoadingCard />
  if (error) return <div className="text-red-500">{error.message}</div>;

  return (
    <>
      <FarmerCard
        farmer={shop?.farmerAllocations[0]?.farmer}
        allocationBPS={shop?.farmerAllocations[0]?.allocationBPS}
        isLoading={isLoading}
      />
      {/* <ItemCarousel
            data={allocations}
            renderFn={(f, i) => }
          /> */}
      <ItemList
        title="Espresso"
        category="espresso"
        horizontal
        shopId={shop?.id}
        items={shop?.menu['espresso']}
      />
      <ItemList
        title="Coffee"
        category="coffee"
        horizontal
        shopId={shop?.id}
        items={shop?.menu['coffee']}
      />
    </>
  );
}

//
/// STATIC PAGE
//
export default function StaticShopPage(
  staticShop: StaticPageData,
  ...dehydratedState: DehydratedState[]
) {
  return (
    <main className="flex flex-col mb-32">
      <HydrationBoundary state={dehydratedState}>
        <ShopHeader {...staticShop} />
        <div className="p-5 px-6 flex flex-col gap-5">
          <ShopHeaderDetails {...staticShop} />
          <DynamicShopPage {...staticShop} />
        </div>
      </HydrationBoundary>
    </main>
  );
}
