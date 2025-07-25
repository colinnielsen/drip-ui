import FarmerCard from '@/components/shop-page/farmer-intro-card';
import { ShopHeader, ShopHeaderDetails } from '@/components/shop-page/header';
import { ItemList } from '@/components/shop-page/item-list';
import { ShopPageHead } from '@/components/shop-page/ShopPageHead';
import { SLICE_VERSION } from '@/data-model/_external/data-sources/slice/SliceDTO';
import { mapSquareStoreExternalIdToShopId } from '@/data-model/_external/data-sources/square/SquareDTO';
import {
  mapSliceStoreIdToShopId,
  EMPTY_MENU,
  mapSliceExternalIdToSliceId,
} from '@/data-model/shop/ShopDTO';
import { Shop } from '@/data-model/shop/ShopType';
import { rehydrateData } from '@/lib/utils';
import { farmerQuery } from '@/queries/FarmerQuery';
import { useShop } from '@/queries/ShopQuery';
import ShopService from '@/services/ShopService';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { GetStaticPaths, GetStaticProps } from 'next/types';
import { useMemo } from 'react';

///
///// STATIC SITE GENERATION
///

export type StaticPageData = Awaited<
  ReturnType<typeof STATIC_PAGE_DATA>
>[number];

const STATIC_PAGE_DATA = () =>
  ShopService.findAllShopConfigs().then(configs =>
    configs.map(c => ({
      __type: 'storefront',
      id:
        c.__type === 'slice'
          ? mapSliceStoreIdToShopId(
              mapSliceExternalIdToSliceId(c.externalId),
              SLICE_VERSION,
            )
          : mapSquareStoreExternalIdToShopId(c.externalId),
      label: c.name,
      backgroundImage: c.backgroundImage ?? '',
      logo: c.logo ?? '',
      location: 'location' in c ? c.location : null,
    })),
  );

export const getStaticPaths = (async () => {
  const paths = (await STATIC_PAGE_DATA()).map(d => ({
    params: { shopId: d.id },
  }));
  return { paths, fallback: 'blocking' };
}) satisfies GetStaticPaths;

export const getStaticProps: GetStaticProps<{
  staticShop: StaticPageData;
  dehydratedState: DehydratedState;
}> = async ({ params }) => {
  if (!params?.shopId) throw Error('cannot find params');

  const staticShop = (await STATIC_PAGE_DATA()).find(
    l => l.id === params.shopId,
  )!;
  if (!staticShop) return { notFound: true };

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['shop', staticShop.id],
    queryFn: () =>
      ShopService.findById(staticShop.id, { rehydrate: false }).then(s => s!),
    staleTime: 0,
  });

  const data: Shop = queryClient.getQueryData([
    'shop' as const,
    staticShop.id,
  ])!;

  const [selectedFarmer] = data?.farmerAllocations || [null];
  if (selectedFarmer)
    await queryClient.prefetchQuery(farmerQuery(selectedFarmer.farmer));
  const dehydratedState = dehydrate(queryClient);

  return {
    props: {
      staticShop,
      dehydratedState,
    },
  };
};

//
/// DYNAMIC PAGE
//
function DynamicShopPage(staticShop: StaticPageData) {
  const { data: shop, error, isLoading } = useShop({ id: staticShop.id });

  if (error) return <div className="text-red-500">{error.message}</div>;

  const items = Object.entries(shop?.menu || EMPTY_MENU)
    .filter(([_, items]) => (isLoading ? true : items.length > 0))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const hasFarmerAllocation = shop?.farmerAllocations[0]?.farmer;

  return (
    <>
      {hasFarmerAllocation && (
        <FarmerCard
          farmer={shop?.farmerAllocations[0]?.farmer}
          allocationBPS={shop?.farmerAllocations[0]?.allocationBPS}
          isLoading={isLoading}
        />
      )}

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
export default function StaticShopPage({
  staticShop,
  dehydratedState: _dehydratedState,
}: {
  staticShop: StaticPageData;
  dehydratedState: DehydratedState;
}) {
  const dehydratedState = useMemo(
    () => rehydrateData(_dehydratedState),
    [_dehydratedState],
  );

  return (
    <>
      <ShopPageHead shop={staticShop} />

      <main className="flex flex-col pb-40">
        <HydrationBoundary state={dehydratedState}>
          <ShopHeader {...staticShop} />
          <div className="p-5 px-6 flex flex-col gap-5">
            <ShopHeaderDetails {...staticShop} />
            <DynamicShopPage {...staticShop} />
          </div>
        </HydrationBoundary>
      </main>
    </>
  );
}
