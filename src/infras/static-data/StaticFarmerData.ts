import {
    createFarmer,
    Farmer,
    FarmerAllocation,
} from "@/data-model/types-TODO/farmer";
import { VitalikAddress } from "./StaticPlaceholderData";
import { v4 } from "uuid";
import { UUID } from "crypto";

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

const createDefaultAllocation = (
    farmerIndex: number,
    allocation: number,
): FarmerAllocation => {
    const farmer = farmerData[farmerIndex];
    if (!farmer) {
        throw new Error(`Farmer not found at index: ${farmerIndex}`);
    }
    return {
        id: v4() as UUID,
        farmer: farmer.id,
        allocationBPS: allocation,
    };
};

export const farmerAllocations: FarmerAllocation[] = [
    createDefaultAllocation(0, 100),
    createDefaultAllocation(1, 50),
    createDefaultAllocation(2, 25),
];
