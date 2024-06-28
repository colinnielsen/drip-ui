"use client";
import Image from "next/image";
import { WelcomeDialog } from "@/components/Dialog";
import coffee from "@/assets/coffee.jpg";
import { Header } from "@/components/Header";
import { LocationList } from "@/components/LocationList";
import { Footer } from "@/components/Footer";
import { cafeData } from "@/infras/static-data/StaticCafeData";
import { useCafes } from "@/infras/database";

export default function Home() {
  const { data: cafes } = useCafes();

  return (
    <main className="flex flex-col gap-5 mb-32">
      <WelcomeDialog
        title="Welcome to Drip"
        image={coffee}
        imageAlt="coffee"
        description="Make changes to your profile here. Click save
            when you're done. This should be a little bit
            longer."
        buttonText="NEXT"
        defaultOpen={true}
      />
      <Header />
      <div className="w-screen max-h-64 overflow-hidden">
        <Image src={coffee} alt="coffee" />
      </div>

      <LocationList title="Near You" cafes={cafes?.slice(0, 2) ?? []} />
      <LocationList title="Popular" cafes={cafes?.slice(2) ?? []} />
      <Footer />
    </main>
  );
}
