import { UUID } from "crypto";
import { Item, ItemOption } from "./item";

export type Order = {
    id: UUID;
    timestamp: string;
    // The id of the cafe
    cafe: UUID;
    // Id of the user who placed the order
    user: UUID;
    // The items the user ordered
    orderItems: OrderItem[];
};

export type OrderItem = {
    id: UUID;
    item: Item;
    options: ItemOption[];
};

export type UniqueItem = {
    id: UUID;
    item: Item;
    count: number;
};

export type OrderRepository = {
    // Create a new order
    save: (item: Item, options: ItemOption[]) => Promise<void>;
    // Update an item in the order in place
    update: (id: UUID, options: ItemOption[]) => Promise<void>;
    // Remove an item from the order
    delete: (id: UUID) => Promise<void>;
    // Clear the order
    clear: () => Promise<void>;
    // Get an item in the order by id
    findById: (id: UUID) => Promise<OrderItem | null>;
    // Get all items in the order
    findAll: () => Promise<OrderItem[]>;
    // Like findAll, but returns a list of unique items.
    // In this case, unique means that the same item with the same options
    findUnique: () => Promise<UniqueItem[]>;
};
