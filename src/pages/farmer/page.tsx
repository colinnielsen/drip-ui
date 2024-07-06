;
import { LocationHeader, LocationDetails } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { Footer } from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useBestSellers, useCafe, useFarmer } from "@/infras/database";
import { UUID } from "crypto";
import { ItemCarousel } from "@/components/ItemCarousel";
import { FarmerDetails, FarmerHeader } from "@/components/FarmerHeader";

// Things left to do here:
// TODO Add tip panel
// TODO Add messages (probably worth using an external service for this)
// TODO Add activity log data

export default function FarmerPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    throw new Error("No farmer id provided");
  }

  const query = useFarmer(id as UUID);

  if (query.status === "pending") {
    return <div>Loading...</div>;
  }

  if (query.status === "error") {
    return <div>Error: {query.error.message}</div>;
  }

  const farmer = query.data;

  if (!farmer) {
    throw new Error("Farmer not found");
  }

  return (
    <main className="flex flex-col min-h-screen mb-32">
      <FarmerHeader {...farmer} />
      <div className="p-5 px-6 flex flex-col gap-5">
        <FarmerDetails {...farmer} />
        <div className="py-12 w-full flex justify-center items-center bg-neutral-500 rounded-3xl"></div>
      </div>
      <Footer />
    </main>
  );
}
