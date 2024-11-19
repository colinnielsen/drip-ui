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
    return {
      ...connection,
      accessToken: decrypt(connection.accessToken_encrypted),
      refreshToken: decrypt(connection.refreshToken_encrypted),
    };
  };
