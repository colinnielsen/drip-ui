import axios, { AxiosRequestConfig } from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { UUID } from 'crypto';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    if (axios.isAxiosError(error) && error.response) throw error;

    throw new Error('An unexpected error occurred');
  }
};

export const isSSR = () => {
  const is = typeof window === 'undefined';
  console.log({ isSSR: is });
  return is;
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

export const never = (msg: string): never => {
  throw new Error(msg);
};
