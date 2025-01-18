import { PersistanceLayer } from '@/data-model/_common/db/PersistanceType';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import { mapSQLQueriedCSRFTokenToCSRFToken } from '@/data-model/csrf-tokens/CSRFTokenDTO';
import { CSRFToken } from '@/data-model/csrf-tokens/CSRFTokenType';
import { generateUUID } from '@/lib/utils';
import { sql } from '@vercel/postgres';
import { UUID } from '@/data-model/_common/type/CommonType';

const save = async (obj: Unsaved<CSRFToken>): Promise<CSRFToken> => {
  const saved = await sql`
      INSERT INTO csrf_tokens (
        id,
        user_id,
        token
        )
        VALUES
        (
        ${generateUUID()},
        ${obj.userId},
        ${obj.token}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        token = EXCLUDED.token
      RETURNING *
    `;

  return mapSQLQueriedCSRFTokenToCSRFToken(saved.rows[0]);
};

const findByUserId = async (userId: UUID): Promise<CSRFToken | null> => {
  const result = await sql`
    SELECT * FROM csrf_tokens
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  const [token] = result.rows as [CSRFToken | null];

  if (!token) return null;
  return mapSQLQueriedCSRFTokenToCSRFToken(token);
};

const findById = async (id: UUID): Promise<CSRFToken | null> => {
  const result = await sql`
    SELECT * FROM csrf_tokens
    WHERE id = ${id}
    LIMIT 1
  `;

  const [token] = result.rows as [CSRFToken | null];

  if (!token) return null;
  return mapSQLQueriedCSRFTokenToCSRFToken(token);
};

const remove = async (id: UUID): Promise<void> => {
  await sql`DELETE FROM csrf_tokens WHERE id = ${id}`;
};

const SQLCSRFTokenPersistanceLayer: PersistanceLayer<CSRFToken> = {
  save,
  findById,
  findByUserId,
  remove,
};

export default SQLCSRFTokenPersistanceLayer;
