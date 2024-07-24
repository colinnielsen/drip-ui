import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next/types';

export const withErrorHandling = (
  handler: NextApiHandler,
  errorPrefix?: string,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      const predicate = errorPrefix ? ` ${errorPrefix}: ` : '';
      debugger;
      return res
        .status(500)
        .json({ error: `Drip Server Error:${predicate}${error}` });
    }
  };
};
