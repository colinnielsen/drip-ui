"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import * as React from "react";
import { BackSvg, CarIcon } from "./Helpers";
import { Cafe } from "@/data/cafe/CafeType";
import { Farmer } from "@/data/types-TODO/farmer";

export function FarmerHeader({ image, name }: Farmer) {
  const router = useRouter();
  return (
    <header className="relative h-1/3">
      <img src={image} alt="backdrop" />
      <button onClick={() => router.back()}>
        <BackSvg />
      </button>
    </header>
  );
}

export function FarmerDetails({
  name,
  shortDescription,
  ethAddress,
  infoUrl,
}: Farmer) {
  return (
    <div className="flex flex-col  pt-3 font-sans text-[16px] font-semibold">
      <h1 className="text-[32px] font-sans font-medium ">{name}</h1>
      <div className="flex items-center gap-1">
        <p className="text-sm font-sans font-medium">{shortDescription}</p>
        <p className="text-sm font-sans font-medium">
          Eth Address: {ethAddress}
        </p>
      </div>
    </div>
  );
}
