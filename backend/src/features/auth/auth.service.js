import { AppError } from '../../shared/app-error.js';
import { hashPassword, verifyPassword } from './password.js';

const invalidCredentials = () => new AppError({
  status: 401,
  code: 'UNAUTHENTICATED',
  message: 'Invalid email or password',
});

const invalidSession = () => new AppError({
  status: 401,
  code: 'UNAUTHENTICATED',
  message: 'Refresh session is invalid or expired',
});

function sessionExpiry(now, days) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function createAuthService({
  users,
  sessions,
  tokens,
  refreshSessionTtlDays,
  clock = () => new Date(),
}) {
  async function createSession(user, context) {
    const refreshToken = tokens.createRefreshToken();
    await sessions.create({
      userId: user._id,
      tokenHash: tokens.hashRefreshToken(refreshToken),
      expiresAt: sessionExpiry(clock(), refreshSessionTtlDays),
      userAgent: context.userAgent || '',
      ipAddress: context.ipAddress || '',
    });
    return {
      user,
      accessToken: tokens.createAccessToken(user),
      refreshToken,
      expiresInSeconds: 15 * 60,
    };
  }

  return Object.freeze({
    async register(input) {
      const passwordHash = await hashPassword(input.password);
      try {
        return await users.create({
          name: input.name,
          email: input.email,
          passwordHash,
          role: 'user',
        });
      } catch (error) {
        if (error?.code === 11000) {
          throw new AppError({
            status: 409,
            code: 'EMAIL_EXISTS',
            message: 'An account with this email already exists',
          });
        }
        throw error;
      }
    },
    async login(input, context) {
      const user = await users.findCredentialsByEmail(input.email);
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw invalidCredentials();
      }
      const { passwordHash: _passwordHash, ...publicUser } = user;
      return createSession(publicUser, context);
    },
    async refresh(refreshToken, context) {
      if (!refreshToken) throw invalidSession();
      const now = clock();
      const consumed = await sessions.consumeActive(tokens.hashRefreshToken(refreshToken), now);
      if (!consumed) throw invalidSession();
      const user = await users.findPublicById(consumed.userId);
      if (!user) throw invalidSession();
      return createSession(user, context);
    },
    async logout(refreshToken) {
      if (refreshToken) {
        await sessions.revoke(tokens.hashRefreshToken(refreshToken), clock());
      }
    },
    async currentUser(userId) {
      const user = await users.findPublicById(userId);
      if (!user) {
        throw new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'User is not authenticated' });
      }
      return user;
    },
  });
}

