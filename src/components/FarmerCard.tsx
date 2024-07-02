import { FarmerAllocation } from "@/data/types-TODO/farmer";
import { useFarmer } from "@/infras/database";
import Link from "next/link";

export function FarmerLink({ allocation }: { allocation: FarmerAllocation }) {
  return (
    <Link href={`/farmer?id=${allocation.farmer}`}>
      <FarmerCard allocation={allocation} />
    </Link>
  );
}

export function FarmerCard({ allocation }: { allocation: FarmerAllocation }) {
  let { farmer: farmerId, allocationBPS } = allocation;

  let query = useFarmer(farmerId);
  let farmer = query.data;

  if (query.isLoading) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  if (!farmer) {
    return <div>Farmer not found</div>;
  }

  return (
    <div className="">
      <div>{farmer.name}</div>
      <img src={farmer.image} />
      <div>{allocationBPS} BPS</div>
    </div>
  );
}
