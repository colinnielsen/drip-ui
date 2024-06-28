"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import * as React from "react";
import { BackSvg, CarIcon } from "./Helpers";
import { Cafe } from "@/data/cafe/CafeType";

export function LocationHeader({ backgroundImage, logo }: Cafe) {
  const router = useRouter();
  return (
    <header className="relative h-1/3">
      <img src={backgroundImage} alt="backdrop" />
      <Image
        src={logo}
        alt="logo"
        width={75}
        height={75}
        className="absolute -bottom-5 left-5 rounded-full shadow-lg"
      />
      <button onClick={() => router.back()}>
        <BackSvg />
      </button>
    </header>
  );
}

export function LocationDetails({ label }: Cafe) {
  return (
    <div className="flex flex-col  pt-3 font-sans text-[16px] font-semibold">
      <h1 className="text-[32px] font-sans font-medium ">{label}</h1>
      <div className="flex items-center gap-1">
        <CarIcon />
        {/* <p className="text-sm font-normal text-neutral-400">{address}</p> */}
      </div>
    </div>
  );
}
