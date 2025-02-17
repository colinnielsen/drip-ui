import { mapToUser } from '@/data-model/user/UserDTO';
import { User } from '@/data-model/user/UserType';
import { createEffectService, GenericError } from '@/lib/effect';
import { PayRequest } from '@/pages/api/orders/pay';
import { sql } from '@vercel/postgres';
import { Effect, pipe } from 'effect';
import { NextApiRequest, NextApiResponse } from 'next';
import { UUID } from 'node:crypto';
import { Address } from 'viem';
import {
  authenticationService,
  TokenCreationError,
} from './AuthenticationService';

const findById = async <U extends User>(id: UUID) => {
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  const [maybeUser] = result.rows;
  if (!maybeUser) return null;

  return maybeUser as U;
};

const findByAuthServiceId = async (id: string): Promise<User | null> => {
  const result =
    await sql`SELECT * FROM users WHERE "authServiceId"->>'id' = ${id}`;
  const maybeUser = result.rows[0];
  return maybeUser as User | null;
};

const findByWalletAddress = async (
  walletAddress: Address,
): Promise<User | null> => {
  const result =
    await sql`SELECT * FROM users WHERE "wallet"->>'address' = ${walletAddress}`;
  const maybeUser = result.rows[0];
  return maybeUser as User | null;
};

const save = async <T extends User>(user: T): Promise<T> => {
  await sql`
      INSERT INTO "users" (id, "authServiceId", wallet, "createdAt")
      VALUES (${user.id},${JSON.stringify(user.authServiceId)}, ${JSON.stringify(user.wallet)}, ${user.createdAt.toISOString()})
          ON CONFLICT (id) DO UPDATE SET
            "authServiceId" = EXCLUDED."authServiceId",
            wallet = EXCLUDED.wallet,
            "createdAt" = EXCLUDED."createdAt"
        `;
  return user;
};

const deleteUser = async (id: UUID): Promise<void> => {
  const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING *`;
  if (result.rowCount === 0) throw Error('could not delete');
};

const getOrInitializeUserFromPayRequest = (
  req: NextApiRequest,
  res: NextApiResponse,
  payRequest: PayRequest,
): Effect.Effect<User, TokenCreationError | GenericError, never> => {
  const pipeline = pipe(
    // if the user exists from the cookies return it to the success channel
    authenticationService.checkAuthentication(req, res),
    // if it does not exist, there will be an unauthorized error
    Effect.catchTag('UnauthorizedError', () => {
      const walletAddress =
        payRequest.type === 'slice'
          ? payRequest.payerAddress
          : payRequest.usdcAuthorization.from;

      return pipe(
        // pipe over the wallet address
        walletAddress,
        // try to find the user from the wallet address
        effectfulUserService.findByWalletAddress,
        Effect.andThen(maybeUser => {
          // if the user exists, return it to the success channel
          if (maybeUser) return Effect.succeed(maybeUser);
          // if the user does not exist, create a new user
          return pipe(
            // make a new user
            mapToUser({
              wallet: { address: walletAddress, __type: 'unknown' },
            }),
            // save the user
            effectfulUserService.save,
            // return the user
            Effect.andThen(user => Effect.succeed(user)),
          );
        }),
      );
    }),
  );
  return pipeline;
};

//
//// SERVICE OBJECT
///

const userService = {
  findById,
  findByAuthServiceId,
  findByWalletAddress,
  getOrInitializeUserFromPayRequest,
  save,
  deleteUser,
};

export default userService;

export const effectfulUserService = createEffectService({
  findById,
  findByAuthServiceId,
  findByWalletAddress,
  save,
  deleteUser,
});
