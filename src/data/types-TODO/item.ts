import { UUID } from "crypto";

export type ItemCategory = "espresso" | "coffee" | "syrup" | "extras";

type BaseOption = {
  id: UUID;
  name: string;
  price: number;
  currency: "eth" | "usd";
  isOptional: boolean;
};

export type NumericOption = BaseOption & {
  value: number | null;
};

export type BooleanOption = BaseOption & {
  value: boolean | null;
};

export type ItemOption = NumericOption | BooleanOption;

export type Item = {
  id: UUID;
  name: string;
  price: number;
  currency: "eth" | "usd";
  description: string;
  image: string;
};

export const createItem = (data: {
  id: UUID;
  name: string;
  price: number;
  currency: "eth" | "usd";
  description: string;
  image: string;
}): Item => ({
  ...data,
});

export const createBooleanOption = (data: {
  id: UUID;
  name: string;
  price: number;
  currency: "eth" | "usd";
  category: string;
  isOptional: boolean;
}): BooleanOption => ({
  value: null,
  ...data,
});

export const createNumericOption = (data: {
  id: UUID;
  name: string;
  price: number;
  currency: "eth" | "usd";
  category: string;
  isOptional: boolean;
}): NumericOption => ({
  value: null,
  ...data,
});
