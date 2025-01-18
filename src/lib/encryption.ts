import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getEncryptionKey } from './constants';

export const encrypt = (text: string): string => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(getEncryptionKey(), 'hex'),
    iv,
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = (text: string): string => {
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted text format');

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(getEncryptionKey(), 'hex'),
    iv,
  );
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
