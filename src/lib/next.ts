import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next/types';

export const withErrorHandling = (
  handler: NextApiHandler,
  handlerPrefix?: string,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      console.time(`\x1b[33m${handlerPrefix} time\x1b[0m`);
      const response = await handler(req, res);
      console.timeEnd(`\x1b[33m${handlerPrefix} time\x1b[0m`);
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
