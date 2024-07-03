import { Coffee } from "@phosphor-icons/react/dist/ssr";
import { CafeModule } from "@/data/cafe/CafeModule";
import { Cafe } from "@/data/cafe/CafeType";
import { getTotalAllocationBPS } from "@/data/types-TODO/farmer";
import { UUID } from "crypto";
import Image from "next/image";
import Link from "next/link";

type LocationListProps = {
  title: string;
  cafes: Cafe[];
};

export function LocationList({ title, cafes }: LocationListProps) {
  return (
    <div className="w-full px-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-8 mt-5">
        {cafes.map((cafe, index) => (
          <Location key={index} {...cafe} />
        ))}
      </div>
    </div>
  );
}

export function Location({
  label,
  backgroundImage,
  farmerAllocations,
  id,
}: Cafe) {
  const allocationTotal = getTotalAllocationBPS(farmerAllocations);

  return (
    <Link href={`/location?id=${id}`}>
      <div className="flex flex-col gap-1">
        <div className="overflow-hidden h-40 relative w-full">
          <Image
            src={backgroundImage}
            alt={label}
            quality={20}
            fill={true}
            className="rounded-3xl object-cover"
          />
        </div>
        <h3 className="font-semibold text-lg">{label}</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <p>tbd mi</p>
          <div className="rounded-full h-1 w-1 bg-neutral-400"></div>
          <p>tbd district</p>
        </div>
        {/* need actual coffee icon
        should align fine with good icon/svg but may take some tweak */}
        <div className="flex items-center gap-1">
          <Coffee />
          <p className="text-xs font-bold">
            {allocationTotal / 100}% FOR THE GROWER
          </p>
        </div>
      </div>
    </Link>
  );
}
