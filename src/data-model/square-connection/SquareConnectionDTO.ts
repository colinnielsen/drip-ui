import { EncryptedSquareConnection } from '@/infrastructures/sql/SquareConnectionPersistance';
import { decrypt } from '@/lib/encryption';
import {
  DecryptedSquareConnection,
  SquareConnection,
} from './SquareConnectionType';

export const isEncryptedSquareConnection = (
  connection: Partial<SquareConnection>,
): connection is EncryptedSquareConnection =>
  'accessToken_encrypted' in connection &&
  'refreshToken_encrypted' in connection;

export const isDecryptedSquareConnection = (
  connection: Partial<SquareConnection>,
): connection is DecryptedSquareConnection =>
  'accessToken' in connection && 'refreshToken' in connection;

export const decryptSquareConnection =
  //   (persistanceLayer: PersistanceLayer<SquareConnection>) =>
  (connection: EncryptedSquareConnection): DecryptedSquareConnection => {
    const { accessToken_encrypted, refreshToken_encrypted, ...rest } =
      connection;
    return {
      ...rest,
      accessToken: decrypt(accessToken_encrypted),
      refreshToken: decrypt(refreshToken_encrypted),
    };
  };
