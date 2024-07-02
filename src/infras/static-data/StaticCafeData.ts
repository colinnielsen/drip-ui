import { Cafe, createOnlineShop, createStorefront } from "@/data/cafe/CafeType";

import {
    DefaultCategoryOptions,
    DefaultMenu,
    DefaultOptions,
} from "./StaticMenuData";
import { farmerAllocations } from "./StaticFarmerData";

export const cafeData: Cafe[] = [
    createStorefront({
        label: "Brews Brothers",
        location: [35.6895, 139.6917],
        farmerAllocations,
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
        categoryOptions: DefaultCategoryOptions,
    }),
    createStorefront({
        label: "Expresso Yourself",
        location: [35.6895, 139.6917],
        farmerAllocations,
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
        categoryOptions: DefaultCategoryOptions,
    }),
    createStorefront({
        label: "WHT R THOZ Roasting Company",
        url: "https//cafe3.com",
        farmerAllocations,
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
        categoryOptions: DefaultCategoryOptions,
    }),
    createOnlineShop({
        label: "Sip Happens",
        url: "https://cafe4.com",
        farmerAllocations,
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
        categoryOptions: DefaultCategoryOptions,
    }),
];
