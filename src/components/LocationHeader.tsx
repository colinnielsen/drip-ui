import { isStorefront } from "@/data-model/cafe/CafeDTO";
import { Cafe } from "@/data-model/cafe/CafeType";
import { CarSimple } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { BackSvg } from "./Helpers";
import { StaticLocationData } from "@/pages/location/[id]";
import { useRouter } from "next/dist/client/router";

export function LocationHeader({
  backgroundImage,
  logo,
}: {
  backgroundImage: string;
  logo: string;
}) {
  const router = useRouter();
  return (
    <header className="relative h-[25vh]">
      <Image src={backgroundImage} alt="backdrop" quality={20} fill={true} />
      <Image
        src={logo}
        alt="logo"
        width={75}
        height={75}
        quality={20}
        className="absolute -bottom-5 left-5 rounded-full shadow-lg"
      />
      <button onClick={() => router.back()}>
        <BackSvg />
      </button>
    </header>
  );
}

export function LocationDetails(staticLocation: StaticLocationData) {
  return (
    <div className="flex flex-col  pt-3 font-sans text-[16px] font-semibold">
      <h1 className="text-[32px] font-sans font-medium ">
        {staticLocation.label}
      </h1>
      <div className="flex items-center gap-1">
        <CarSimple weight="bold" />
        <p className="text-sm font-normal text-neutral-400">
          {staticLocation.location
            ? staticLocation.location?.join(", ")
            : "Online only"}
        </p>
      </div>
    </div>
  );
}
