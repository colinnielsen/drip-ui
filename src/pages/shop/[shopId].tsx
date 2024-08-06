import FarmerCard from '@/components/shop-page/farmer-intro-card';
import { ShopHeader, ShopHeaderDetails } from '@/components/shop-page/header';
import { ItemList } from '@/components/shop-page/item-list';
import { SLICE_VERSION } from '@/data-model/_common/type/SliceDTO';
import { ItemCategory } from '@/data-model/item/ItemType';
import { deriveShopIdFromSliceStoreId } from '@/data-model/shop/ShopDTO';
import { Shop } from '@/data-model/shop/ShopType';
import { ONBOARDED_SHOPS } from '@/lib/static-data';
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

const STATIC_PAGE_DATA = ONBOARDED_SHOPS.map(c => ({
  __type: 'storefront',
  id: deriveShopIdFromSliceStoreId(c.sliceId, SLICE_VERSION),
  label: c.name,
  backgroundImage: c.backgroundImage ?? '',
  logo: c.logo ?? '',
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
  await queryClient.prefetchQuery(shopQuery({ id: params.shopId as UUID }));
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
  const { data: shop, error, isLoading } = useShop({ id: staticShop.id });

  if (error) return <div className="text-red-500">{error.message}</div>;

  const emptyMenu = {
    espresso: [],
    coffee: [],
    other: [],
  };

  const items = Object.entries(shop?.menu || emptyMenu).filter(([_, items]) =>
    isLoading ? true : items.length > 0,
  );

  return (
    <>
      <FarmerCard
        farmer={shop?.farmerAllocations[0]?.farmer}
        allocationBPS={shop?.farmerAllocations[0]?.allocationBPS}
        isLoading={isLoading}
      />

      {shop && items.length === 0 && (
        <div className="text-center text-gray-500">
          No items available at this time
        </div>
      )}
      {items.map(([category, items]) => (
        <ItemList
          key={category}
          title={category}
          horizontal
          shopId={shop?.id}
          items={items}
        />
      ))}
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
    <main className="flex flex-col pb-40">
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
