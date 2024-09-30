import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next/types';
import { SESSION_COOKIE_NAME } from './session';
import { generateUUID, isUUID } from './utils';

export const getAndValidateUserRequest = (req: NextApiRequest) => {
  const userId = req.cookies[SESSION_COOKIE_NAME];
  if (!userId) throw new Error('User ID not found');
  if (!isUUID(userId)) throw new Error('Invalid User ID');

  return userId;
};

export const revalidatePathIfExists = async (
  res: NextApiResponse,
  path: string,
) => {
  const response = await fetch(path, { method: 'HEAD' }).catch(() => {});
  if (response?.ok) await res.revalidate(path);
};

export const withErrorHandling = (
  handler: NextApiHandler,
  handlerPrefix?: string,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const id = generateUUID().slice(0, 4);
      const timePrefix = `\x1b[33m${handlerPrefix} time\x1b[0m ${id}`;
      console.time(timePrefix);
      const response = await handler(req, res);
      console.timeEnd(timePrefix);
      return response;
    } catch (error) {
      const predicate = handlerPrefix ? ` ${handlerPrefix}: ` : '';
      console.error(predicate, error);
      debugger;
      return res
        .status(500)
        .json({ error: `Drip Server Error:${predicate}${error}` });
    }
  };
};
