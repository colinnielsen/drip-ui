import { Entity } from "@/data/__global/entities";
import { Cafe } from "@/data/cafe/CafeType";

export const cafeData: Cafe[] = [
  {
    id: "2-1-2-2-1",
    __entity: Entity.cafe,
    __type: "storefront",
    label: "Cafe 1",
    location: [35.6895, 139.6917],
    farmerAllocations: { id: "2-1-2-2-1", allocationBPS: 100 },
  },
  {
    id: "2-1-2-2-2",
    __entity: Entity.cafe,
    __type: "storefront",
    label: "Cafe 2",
    location: [35.6895, 139.6917],
    farmerAllocations: { id: "2-1-2-2-1", allocationBPS: 100 },
  },
  {
    id: "2-1-2-2-3",
    __entity: Entity.cafe,
    __type: "online",
    label: "Cafe 3",
    url: "https://cafe3.com",
    farmerAllocations: { id: "2-1-2-2-1", allocationBPS: 100 },
  },
];
