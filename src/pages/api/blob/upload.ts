import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false, // read raw bytes
  },
};

function readBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const filename =
    typeof req.query.filename === 'string' ? req.query.filename : '';
  const folder =
    typeof req.query.folder === 'string' ? req.query.folder : 'uploads';

  if (!filename) return res.status(400).json({ error: 'Missing filename' });

  const contentType = req.headers['content-type'] || 'application/octet-stream';

  try {
    const body = await readBody(req);

    const safeFilename = filename.replace(/[^\w.\-()]/g, '_');
    const path = `${folder}/${Date.now()}-${safeFilename}`;

    const blob = await put(path, body, {
      access: 'public',
      contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Upload failed' });
  }
}
