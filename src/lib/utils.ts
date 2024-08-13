import { ETH } from '@/data-model/_common/currency/ETH';
import { USDC } from '@/data-model/_common/currency/USDC';
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
  const displayPrice = !isUSD
    ? priceString
    : Number(priceString).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return displayPrice;
};

export function rehydrateData<T>(data: any): T {
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data)) return data.map(rehydrateData) as T;
  if (data.__dripType === 'USDC') return USDC.fromJSON(data) as T;
  if (data.__dripType === 'ETH') return ETH.fromJSON(data) as T;
  const result: any = {};
  for (const [key, value] of Object.entries(data))
    result[key] = rehydrateData(value);

  return result as T;
}

export const axiosFetcher = async <T>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<T> => {
  try {
    const response = await axios<T>(url, {
      withCredentials: true,
      transformResponse: (data: string) => {
        if (typeof data === 'string') {
          return rehydrateData(JSON.parse(data));
        } else return data;
      },
      ...options,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error instanceof AggregateError) {
        console.error(error.errors);
        throw error;
      } else if (error.response) {
        console.error(error.response.data);
        throw error;
      }
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

export function isUUID(id: unknown): id is UUID {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

const NAMESPACE = '9D0C0E57-460C-446C-97C2-AE43C347B1BF';

export const generateUUID = (input?: string): UUID => {
  return input ? (uuidv5(input, NAMESPACE) as UUID) : (uuidv4() as UUID);
};

export const err = (msg: string): never => {
  debugger;
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

export const uniqBy = <T extends Record<string, any>>(
  arr: T[],
  key: keyof T,
) => {
  return Object.values(
    arr.reduce(
      (acc, item) => ({ ...acc, [item[key]]: item }),
      {} as Record<keyof T, T>,
    ),
  );
};
