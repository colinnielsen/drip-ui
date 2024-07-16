import axios from 'axios';
import { type ClassValue, clsx } from 'clsx';
import { UUID } from 'crypto';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const axiosFetcher = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.statusText);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const isSSR = () => {
  const is = typeof window === 'undefined';
  console.log({ isSSR: is });
  return is;
};

export const sleep = async (ms?: number) =>
  await new Promise(r => setTimeout(() => r(null), ms));

export function isUUID(id: string): id is UUID {
  return /^[0-9a-fA-F]-[0-9a-fA-F]-[0-9a-fA-F]-[0-9a-fA-F]-[0-9a-fA-F]$/.test(
    id,
  );
}
