import { Schema as S } from 'effect';

export const S_UUID = S.TemplateLiteral(
  S.String,
  '-',
  S.String,
  '-',
  S.String,
  '-',
  S.String,
  '-',
  S.String,
);

export const S_Hex = S.TemplateLiteral('0x', S.String);
