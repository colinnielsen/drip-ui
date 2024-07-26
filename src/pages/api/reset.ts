import { SESSION_COOKIE_NAME } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const cookiesToReset = [SESSION_COOKIE_NAME];
  cookiesToReset.forEach(cookie => {
    res.setHeader(
      'Set-Cookie',
      `${cookie}=null; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    );
  });

  res.status(200).json({ message: 'Cookies reset' });
}
