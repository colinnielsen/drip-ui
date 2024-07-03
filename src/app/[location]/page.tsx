"use client";
import { LocationHeader, LocationDetails } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { Footer } from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useBestSellers, useCafe } from "@/infras/database";
import { UUID } from "crypto";
import { FarmerCard } from "@/components/FarmerCard";

export default function LocationPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) throw new Error("No id provided");

  const { data: cafe, isLoading, isError } = useCafe(id as UUID);
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  if (!cafe) return <div>Cafe not found</div>;

  const allocations = cafe.farmerAllocations;

  return (
    <main className="flex flex-col mb-32">
      <LocationHeader {...cafe} />
      <div className="p-5 px-6 flex flex-col gap-5">
        <LocationDetails {...cafe} />
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
      </div>
      <Footer />
    </main>
  );
}
