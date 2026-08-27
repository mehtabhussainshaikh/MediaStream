import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, keyHex] = String(storedHash).split(':');
  if (!salt || !keyHex) return false;
  const storedKey = Buffer.from(keyHex, 'hex');
  if (storedKey.length !== KEY_LENGTH) return false;
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return timingSafeEqual(storedKey, derivedKey);
}

