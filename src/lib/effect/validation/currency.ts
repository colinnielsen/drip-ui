import { ETH } from '@/data-model/_common/currency/ETH';
import { USDC } from '@/data-model/_common/currency/USDC';
import { Schema as S } from 'effect';

export const S_USDC = S.instanceOf(USDC);
export const S_ETH = S.instanceOf(ETH);
export const S_CurrenciesUnion = S.Union(S_USDC, S_ETH);
