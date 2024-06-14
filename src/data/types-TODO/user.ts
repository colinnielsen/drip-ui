import { UUID } from "crypto";

export type User = {
  id: UUID;
  name: string;
  email: string;
  role: "admin" | "user";
};
