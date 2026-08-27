import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

export function createTokenService({ accessSecret, accessTtl }) {
  return Object.freeze({
    createAccessToken(user) {
      return jwt.sign(
        { role: user.role },
        accessSecret,
        { subject: String(user._id), expiresIn: accessTtl, algorithm: 'HS256' },
      );
    },
    verifyAccessToken(token) {
      return jwt.verify(token, accessSecret, { algorithms: ['HS256'] });
    },
    createRefreshToken() {
      return randomBytes(32).toString('hex');
    },
    hashRefreshToken(token) {
      return createHash('sha256').update(token).digest('hex');
    },
  });
}

