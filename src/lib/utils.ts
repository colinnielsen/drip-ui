import axios, { AxiosRequestConfig } from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { UUID } from 'crypto';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { formatUnits } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const prettyFormatPrice = (
  p: string | bigint,
  decimals: number,
  isUSD: boolean,
) => {
  const price = typeof p === 'string' ? BigInt(p) : p;
  const priceString = formatUnits(price, decimals);
  const displayPrice = !isUSD ? priceString : Number(priceString).toFixed(2);
  return displayPrice;
};

export const axiosFetcher = async <T>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<T> => {
  try {
    const response = await axios<T>(url, {
      withCredentials: true,
      ...options,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(error.response.data);
      throw error;
    }

    throw new Error('An unexpected error occurred: ' + error);
  }
};

export const isSSR = () => {
  const is = typeof window === 'undefined';
  return is;
};

export const logIsSSR = () => {
  console.log({ isSSR: isSSR() });
};

export function isProd() {
  return process.env.NODE_ENV === 'production';
}

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export const sleep = async (ms?: number) =>
  await new Promise(r => setTimeout(() => r(null), ms));

export function isUUID(id: string): id is UUID {
  return /^[0-9a-fA-F]-[0-9a-fA-F]-[0-9a-fA-F]-[0-9a-fA-F]-[0-9a-fA-F]$/.test(
    id,
  );
}

const NAMESPACE = '9D0C0E57-460C-446C-97C2-AE43C347B1BF';

export const generateUUID = (input?: string): UUID => {
  return input ? (uuidv5(input, NAMESPACE) as UUID) : (uuidv4() as UUID);
};

export const err = (msg: string): never => {
  throw new Error(msg);
};

export const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

export const minutes = (minutes: number) => minutes * 60 * 1000;

export const isIOSSafari = () => {
  return (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/)
  );
};

export const sortDateAsc = (a: Date | string, b: Date | string) => {
  return new Date(b).getTime() - new Date(a).getTime();
};
