import { PersistanceLayer } from '@/data-model/_common/db/PersistanceType';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import { deriveSquareConnectionIdFromMerchantId } from '@/data-model/_external/data-sources/square/SquareDTO';
import {
  decryptSquareConnection,
  isDecryptedSquareConnection,
} from '@/data-model/square-connection/SquareConnectionDTO';
import {
  BaseSquareConnection,
  DecryptedSquareConnection,
  SquareConnection,
} from '@/data-model/square-connection/SquareConnectionType';
import { encrypt } from '@/lib/encryption';
import { generateUUID } from '@/lib/utils';
import { sql } from '@vercel/postgres';
import { UUID } from 'crypto';

export type EncryptedSquareConnection = BaseSquareConnection & {
  /**
   * Encrypted access token
   */
  accessToken_encrypted: string;
  /**
   * Encrypted refresh token
   */
  refreshToken_encrypted: string;
};

const save = async (
  connection: Unsaved<SquareConnection>,
): Promise<DecryptedSquareConnection> => {
  if (isDecryptedSquareConnection(connection)) {
    const encryptedAccessToken = encrypt(connection.accessToken);
    const encryptedRefreshToken = encrypt(connection.refreshToken);
    await sql`
      INSERT INTO square_connections (
        id,
        "userId",
        "merchantId",
        "accessToken_encrypted",
        "refreshToken_encrypted",
        "expiresAt"
        )
        VALUES
        (
        ${deriveSquareConnectionIdFromMerchantId(connection.merchantId)},
        ${connection.userId},
        ${connection.merchantId},
        ${encryptedAccessToken},
        ${encryptedRefreshToken},
        ${connection.expiresAt.toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        "userId" = EXCLUDED."userId",
        "accessToken_encrypted" = EXCLUDED."accessToken_encrypted",
        "refreshToken_encrypted" = EXCLUDED."refreshToken_encrypted",
        "expiresAt" = EXCLUDED."expiresAt"
    `;

    return connection;
  } else throw new Error('Access tokens are not set');
};

/**
 * @returns the square connection with decrypted access and refresh tokens
 */
const findByUserId = async (
  userId: UUID,
): Promise<DecryptedSquareConnection | null> => {
  const result = await sql`
    SELECT * FROM square_connections
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  const connection = result.rows[0] as EncryptedSquareConnection | null;

  if (!connection) return null;

  const decryptedConnection = decryptSquareConnection(connection);
  return decryptedConnection;
};

const findById = async (
  id: UUID,
): Promise<DecryptedSquareConnection | null> => {
  const result = await sql`
    SELECT * FROM square_connections WHERE id = ${id}
  `;

  const connection = result.rows[0] as EncryptedSquareConnection | null;

  if (!connection) return null;

  const decryptedConnection = decryptSquareConnection(connection);
  return decryptedConnection;
};

const remove = async (id: UUID): Promise<void> => {
  await sql`DELETE FROM square_connections WHERE id = ${id}`;
};

const SQLSquarePersistanceLayer: PersistanceLayer<SquareConnection> = {
  save,
  findById,
  findByUserId,
  remove,
};

export default SQLSquarePersistanceLayer;
