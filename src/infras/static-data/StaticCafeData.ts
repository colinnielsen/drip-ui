import { Cafe, createOnlineShop, createStorefront } from "@/data/cafe/CafeType";
import { DefaultMenu, DefaultOptions, Mocha } from "./StaticMenuData";

export const cafeData: Cafe[] = [
    createStorefront({
        label: "Brews Brothers",
        location: [35.6895, 139.6917],
        farmerAllocations: [{ id: "2-1-2-2-1", allocationBPS: 100 }],
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
    }),
    createStorefront({
        label: "Expresso Yourself",
        location: [35.6895, 139.6917],
        farmerAllocations: [{ id: "2-1-2-2-1", allocationBPS: 100 }],
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
    }),
    createStorefront({
        label: "WHT R THOZ Roasting Company",
        url: "https://cafe3.com",
        farmerAllocations: [{ id: "2-1-2-2-1", allocationBPS: 100 }],
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
    }),
    createOnlineShop({
        label: "Sip Happens",
        url: "https://cafe4.com",
        farmerAllocations: [{ id: "2-1-2-2-1", allocationBPS: 100 }],
        backgroundImage: "/background.jpg",
        logo: "/logo.jpg",
        menu: DefaultMenu,
        options: DefaultOptions,
    }),
];
