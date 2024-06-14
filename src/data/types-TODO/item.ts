export type ItemOption = {
  id: string;
  name: string;
  price: number;
  currency: "eth" | "usd";
  category: string;
  isOptional: boolean
};

export type Item = {
  id: string;
  name: string;
  price: number;
  currency: "eth" | "usd";
  description: string;
  image: string;
  options: ItemOption[];
};
