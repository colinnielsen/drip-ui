import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isSSR = () => {
  const is = typeof window === "undefined";
  console.log({ isSSR: is });
  return is;
};
