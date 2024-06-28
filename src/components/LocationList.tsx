import { CafeModule } from "@/data/cafe/CafeModule";
import { Cafe } from "@/data/cafe/CafeType";
import { getTotalAllocationBPS } from "@/data/types-TODO/farmer";
import { UUID } from "crypto";
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
  logo,
  url,
  farmerAllocations: allocations,
  id,
}: Cafe) {
  // TODO Represent this as a percentage
  const allocationTotal = getTotalAllocationBPS(allocations);

  return (
    <Link href={`/location?&id=${id}`}>
      <div className="flex flex-col gap-1">
        <div className="overflow-hidden h-40 relative">
          <img
            src={logo}
            alt={label}
            className="rounded-xl absolute inset-0 w-full h-full object-cover"
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
          <Icon />
          <p className="text-xs font-bold">{allocationTotal}% FOR THE GROWER</p>
        </div>
      </div>
    </Link>
  );
}

//need actual coffee icon
export function Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="size-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
      />
    </svg>
  );
}
