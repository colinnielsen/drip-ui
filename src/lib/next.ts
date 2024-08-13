import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next/types';
import { SESSION_COOKIE_NAME } from './session';
import { isUUID } from './utils';

export const getAndValidateUserRequest = (req: NextApiRequest) => {
  const userId = req.cookies[SESSION_COOKIE_NAME];
  if (!userId) throw new Error('User ID not found');
  if (!isUUID(userId)) throw new Error('Invalid User ID');

  return userId;
};

export const withErrorHandling = (
  handler: NextApiHandler,
  handlerPrefix?: string,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const timePrefix = `\x1b[33m${handlerPrefix} time\x1b[0m`;
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
