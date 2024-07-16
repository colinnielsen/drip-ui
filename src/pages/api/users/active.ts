import { database } from '@/infras/database';
import { NextApiRequest, NextApiResponse } from 'next';
import { TESTING_USER_UUID } from '@/data-model/user/UserType';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    try {
      const user = await database.user.findById(TESTING_USER_UUID);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active user' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
