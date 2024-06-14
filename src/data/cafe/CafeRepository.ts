import { Cafe } from "@/data/cafe/CafeType";
import { UUID } from "crypto";

export type CafeRepository = {
  findById: (id: UUID) => Promise<Cafe | null>;
  findAll: () => Promise<Cafe[]>;
  save: (item: Cafe) => Promise<void>;
  delete: (id: UUID) => Promise<void>;
};
