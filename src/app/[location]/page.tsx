"use client";

import { LocationHeader, LocationDetails } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { Footer } from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useBestSellers, useCafe } from "@/infras/database";
import { UUID } from "crypto";
import { Cafe } from "@/data/cafe/CafeType";

export default function LocationPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    throw new Error("No id provided");
  }

  const { data: cafe } = useCafe(id as UUID);
  if (!cafe) return null;

  return (
    <main className="flex flex-col min-h-screen mb-32">
      <LocationHeader {...cafe} />
      <div className="p-5 px-6 flex flex-col gap-5">
        <LocationDetails {...cafe} />

        <div className="py-12 w-full flex justify-center items-center bg-neutral-500 rounded-3xl">
          Leaving out the growers panel here?
        </div>
        {/* Cafe should have a best sellers list */}
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

        {/* <ItemCarousel title="Popular Items" drawerProps={items} /> */}
      </div>
      <Footer />
    </main>
  );
}

function BestSellers(cafe: Cafe) {
  let id = cafe.id;
  const { data: bestSellers } = useBestSellers(id);
  if (!bestSellers) return null;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-bold">Best Sellers</h2>
      <div className="flex flex-col gap-5"></div>
    </div>
  );
}
