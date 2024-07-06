import { FarmerCard } from "@/components/FarmerCard";
import { Footer } from "@/components/Footer";
import { LocationDetails, LocationHeader } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { useCafe } from "@/infras/database";
import { cafeData } from "@/infras/static-data/StaticCafeData";
import { UUID } from "crypto";
import { GetStaticPaths, GetStaticProps } from "next/types";

const STATIC_LOCATION_DATA = cafeData.map((c) => ({
  __type: c.__type,
  id: c.id,
  label: c.label,
  backgroundImage: c.backgroundImage,
  logo: c.logo,
  location: "location" in c ? c.location : undefined,
}));

export type StaticLocationData = (typeof STATIC_LOCATION_DATA)[number];

//
/// DYNAMIC PAGE
//
function DynamiclyRenderedLocation(staticLocation: StaticLocationData) {
  const { data: cafe, isLoading, isError } = useCafe(staticLocation.id);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  if (!cafe) return <div>Cafe not found</div>;

  const allocations = cafe.farmerAllocations;

  return (
    <>
      <FarmerCard allocation={allocations[0]} />
      {/* <ItemCarousel
            data={allocations}
            renderFn={(f, i) => }
          /> */}

      <ItemList
        title="Espresso"
        category="espresso"
        items={cafe.menu.get("espresso") || []}
        cafeId={cafe.id}
        horizontal
      />
      <ItemList
        title="Coffee"
        category="coffee"
        cafeId={cafe.id}
        items={cafe.menu.get("coffee") || []}
        horizontal
      />
    </>
  );
}

//
/// STATIC PAGE
//
export default function LocationPage(staticLocation: StaticLocationData) {
  return (
    <main className="flex flex-col mb-32">
      <LocationHeader {...staticLocation} />
      <div className="p-5 px-6 flex flex-col gap-5">
        <LocationDetails {...staticLocation} />
        <DynamiclyRenderedLocation {...staticLocation} />
        <Footer />
      </div>
    </main>
  );
}

///
///// STATIC GENERATION
///

export const getStaticPaths: GetStaticPaths<{ id: UUID }> = () => {
  const paths = STATIC_LOCATION_DATA.map((d) => d.id);
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<StaticLocationData> = ({
  params,
}) => {
  if (!params) throw Error("cannot find params");

  const location = STATIC_LOCATION_DATA.find((l) => l.id === params.id)!;

  if (!location) return { notFound: true };
  return { props: location };
};
