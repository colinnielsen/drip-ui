import { LocationHeader, LocationDetails } from "@/components/LocationHeader";
import { ItemList } from "@/components/LocationItems";
import { Footer } from "@/components/Footer";
import { useBestSellers, useCafe, useFarmer } from "@/infras/database";
import { UUID } from "crypto";
import { ItemCarousel } from "@/components/ItemCarousel";
import { FarmerDetails, FarmerHeader } from "@/components/FarmerHeader";
import { notFound } from "next/navigation";
import { farmerData } from "@/infras/static-data/StaticFarmerData";

// Things left to do here:
// TODO Add tip panel
// TODO Add messages (probably worth using an external service for this)
// TODO Add activity log data

export default function FarmerPage({ farmerId }: { farmerId: string }) {
  const query = useFarmer(farmerId as UUID);

  if (!farmerId) return null;
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

export async function getStaticPaths() {
  return {
    paths: farmerData.map((farmer) => ({
      params: { farmerId: farmer.id },
    })),
    fallback: true,
  };
}

export async function getStaticProps({
  params,
}: {
  params: { farmerId: string };
}) {
  if (!params.farmerId)
    return {
      notFound: true,
    };
  else
    return {
      props: {
        farmerId: params.farmerId,
      },
    };
}
