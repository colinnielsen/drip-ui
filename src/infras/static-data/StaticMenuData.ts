import { Item, ItemCategory, ItemMod } from "@/data-model/item/ItemType";
import {
  createBooleanOption,
  createItem,
  createNumericOption,
} from "@/data-model/item/ItemDTO";

export const EspressoMods: ItemMod[] = [
  createBooleanOption({
    id: "1-1-1-1-1-1",
    name: "Add Shot",
    price: 1,
    currency: "usd",
    category: "espresso",
    isOptional: true,
  }),
  createBooleanOption({
    id: "1-1-1-1-1-2",
    name: "Iced",
    price: 0,
    currency: "usd",
    category: "espresso",
    isOptional: true,
  }),
  createNumericOption({
    id: "1-1-1-1-1-3",
    name: "Shot count",
    price: 1,
    currency: "usd",
    category: "espresso",
    isOptional: true,
  }),
];
export const SyrupMods: ItemMod[] = [
  createBooleanOption({
    id: "1-1-1-1-1-3",
    name: "Vanilla",
    price: 0.75,
    currency: "usd",
    category: "syrup",
    isOptional: true,
  }),
  createBooleanOption({
    id: "1-1-1-1-1-4",
    name: "Chocolate",
    price: 0.75,
    currency: "usd",
    category: "syrup",
    isOptional: true,
  }),
  createBooleanOption({
    id: "1-1-1-1-1-5",
    name: "Caramel",
    price: 0.75,
    currency: "usd",
    category: "syrup",
    isOptional: true,
  }),
];

const createBeverage = (data: {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}) =>
  createItem({
    id: `1-1-1-1-${data.id}`,
    name: data.name,
    price: data.price,
    currency: "usd",
    description: data.description,
    image: data.image,
  });

export const Espresso = createBeverage({
  id: "1",
  name: "Espresso",
  price: 2,
  description: "A shot of espresso",
  image: "/espresso.jpg",
});

export const Latte = createBeverage({
  id: "2",
  name: "Latte",
  price: 6,
  description: "Espresso with steamed milk",
  image: "/latte.jpg",
});

export const Mocha = createBeverage({
  id: "3",
  name: "Mocha",
  price: 5,
  description: "Espresso with steamed milk and chocolate",
  image: "/mocha.png",
});

export const Cappuccino = createBeverage({
  id: "4",
  name: "Cappuccino",
  price: 5.5,
  description: "Espresso with steamed milk and foam",
  image: "/cappuccino.jpeg",
});

export const Americano = createBeverage({
  id: "5",
  name: "Americano",
  price: 3,
  description: "Espresso with hot water",
  image: "/americano.jpeg",
});

export const ColdBrew = createBeverage({
  id: "6",
  name: "Cold Brew",
  price: 4,
  description: "Cold brewed coffee",
  image: "/cold-brew.jpg",
});

export const Cortado = createBeverage({
  id: "7",
  name: "Cortado",
  price: 5.5,
  description: "Espresso with equal parts steamed milk",
  image: "/cortado.jpg",
});

export const DefaultMenu: Record<ItemCategory, Item[]> = {
  espresso: [Espresso, Latte, Mocha, Cappuccino, Americano, Cortado],
  coffee: [ColdBrew],
  extras: [],
  syrup: [],
};

export const DefaultOptions: Record<ItemCategory, ItemMod[]> = {
  espresso: EspressoMods,
  coffee: EspressoMods,
  syrup: SyrupMods,
  extras: [],
};

export const DefaultCategoryOptions: Record<ItemCategory, ItemCategory[]> = {
  espresso: ["espresso", "syrup", "extras"],
  coffee: ["espresso", "syrup", "extras"],
  syrup: [],
  extras: [],
};
