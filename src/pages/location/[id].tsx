import { FarmerCard } from "@/components/FarmerCard";
import { Footer } from "@/components/Footer";
import { LocationDetails, LocationHeader } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { Cafe } from "@/data-model/cafe/CafeType";
import { cafeQuery, farmerQuery, useCafe } from "@/infras/database";
import { cafeData } from "@/infras/static-data/StaticCafeData";
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { UUID } from "crypto";
import { GetStaticPaths, GetStaticProps } from "next/types";

const STATIC_LOCATION_DATA = cafeData.map((c) => ({
  __type: c.__type,
  id: c.id,
  label: c.label,
  backgroundImage: c.backgroundImage,
  logo: c.logo,
  location: "location" in c ? c.location : null,
}));

export type StaticLocationData = (typeof STATIC_LOCATION_DATA)[number];

//
/// DYNAMIC PAGE
//
function DynamicLocation(staticLocation: StaticLocationData) {
  const { data: cafe, isLoading, isError } = useCafe(staticLocation.id);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  if (!cafe) return <div>Cafe not found</div>;

  const [featuredFarmer] = cafe.farmerAllocations;

  return (
    <>
      {featuredFarmer && <FarmerCard allocation={featuredFarmer} />}
      {/* <ItemCarousel
            data={allocations}
            renderFn={(f, i) => }
          /> */}

      <ItemList
        title="Espresso"
        category="espresso"
        items={cafe.menu["espresso"] || []}
        cafeId={cafe.id}
        horizontal
      />
      <ItemList
        title="Coffee"
        category="coffee"
        cafeId={cafe.id}
        items={cafe.menu["coffee"] || []}
        horizontal
      />
    </>
  );
}

//
/// STATIC PAGE
//
export default function StaticLocationPage(
  staticLocation: StaticLocationData,
  ...dehydratedState: DehydratedState[]
) {
  return (
    <main className="flex flex-col mb-32">
      <HydrationBoundary state={dehydratedState}>
        <LocationHeader {...staticLocation} />
        <div className="p-5 px-6 flex flex-col gap-5">
          <LocationDetails {...staticLocation} />
          <DynamicLocation {...staticLocation} />
          <Footer />
        </div>
      </HydrationBoundary>
    </main>
  );
}

///
///// STATIC GENERATION
///

export const getStaticPaths: GetStaticPaths<{ id: UUID }> = () => {
  const paths = STATIC_LOCATION_DATA.map((d) => ({ params: { id: d.id } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<{
  dehydratedState: DehydratedState;
}> = async ({ params }) => {
  if (!params?.id) throw Error("cannot find params");

  const location = STATIC_LOCATION_DATA.find((l) => l.id === params.id)!;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(cafeQuery(params.id as UUID));
  const data: Cafe | undefined = queryClient.getQueryData([
    "cafe",
    params.id as UUID,
  ]);

  const [selectedFarmer] = data?.farmerAllocations || [null];
  if (selectedFarmer)
    await queryClient.prefetchQuery(farmerQuery(selectedFarmer.farmer));

  if (!location) return { notFound: true };
  else
    return {
      props: {
        ...location,
        dehydratedState: dehydrate(queryClient),
      },
    };
};
