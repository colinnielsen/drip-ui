import { Schema as S } from 'effect';
import { S_Hex } from './base';

export const S_ChainId = S.Union(S.Literal(8453));

export const S_Address = S.TemplateLiteral('0x', S.String);

export const S_EthAddress = S.TemplateLiteral(S_ChainId, '::', S_Address);

export const S_USDCAuthorization = S.Struct({
  from: S_Hex,
  to: S_Hex,
  value: S.BigInt,
  validAfter: S.BigInt,
  validBefore: S.BigInt,
  nonce: S_Hex,
  signature: S_Hex,
});
