import { UUID } from "crypto";

export const TESTING_USER_UUID = "1-2-3-4-5" as const;

export type User = {
  id: UUID;
  name: string;
  email: string;
  role: "admin" | "user";
};
