import { UUID } from "crypto";

export type Order = {
    id: UUID;
    timestamp: string;
    // The id of the cafe
    cafe: UUID;
    // Id of the user who placed the order
    user: UUID;
}
