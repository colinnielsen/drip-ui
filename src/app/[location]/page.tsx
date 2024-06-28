"use client";

import { LocationHeader, LocationDetails } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { ItemCarousel } from "@/components/ItemCarousel";

import { items } from "@/components/Helpers";
import { Footer } from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useCafe } from "@/infras/database";
import { UUID } from "crypto";

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
        <ItemList
          title="Best Sellers"
          description=" 
                 The most liked and commonly ordered drinks."
          category="coffee"
          items={cafe.menu.get("espresso") || []}
        />
        {/* <ItemCarousel title="Popular Items" drawerProps={items} /> */}
      </div>
      <Footer />
    </main>
  );
}
