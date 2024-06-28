import { createFarmer, Farmer } from "@/data/types-TODO/farmer";
import { VitalikAddress } from "./StaticPlaceholderData";

export const farmerData: Farmer[] = [
    createFarmer({
        name: "Gilgamesh",
        image: "/farmer1.jpg",
        shortDescription: "The oldest farmer in the world",
        infoUrl: "https://gilgamesh.com",
        ethAddress: VitalikAddress,
    }),
    createFarmer({
        name: "Richard Stallman",
        image: "/farmer2.jpg",
        shortDescription: "The most free and open source farmer in the world",
        infoUrl: "https://fsf.org",
        ethAddress: VitalikAddress,
    }),
    createFarmer({
        name: "Stichard Rallman",
        image: "/farmer3.jpg",
        shortDescription:
            "The least free and open source farmer in the world. Hates freedom.",
        infoUrl: "https://fsf.org",
        ethAddress: VitalikAddress,
    }),
];
