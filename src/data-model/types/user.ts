export type Cart = {
  items: {
    id: string;
    quantity: number;
  }[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  cart: Cart;
};
