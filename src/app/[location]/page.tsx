"use client";
import { LocationHeader, LocationDetails } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { Footer } from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useBestSellers, useCafe } from "@/infras/database";
import { UUID } from "crypto";
import { FarmerLink } from "@/components/FarmerCard";
import { ItemCarousel } from "@/components/ItemCarousel";

export default function LocationPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    throw new Error("No id provided");
  }

  const { data: cafe } = useCafe(id as UUID);
  if (!cafe) {
    return <div>Loading...</div>;
  }

  const allocations = cafe.farmerAllocations;

  return (
    <main className="flex flex-col min-h-screen mb-32">
      <LocationHeader {...cafe} />
      <div className="p-5 px-6 flex flex-col gap-5">
        <LocationDetails {...cafe} />

        <div className="py-12 w-full flex justify-center items-center bg-neutral-500 rounded-3xl">
          <ItemCarousel
            data={allocations}
            renderFn={(f, i) => <FarmerLink allocation={f} />}
          />
        </div>
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
