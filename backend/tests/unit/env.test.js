import { loadConfig } from '../../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3001',
  MONGODB_URI: 'mongodb://localhost:27017/mediastream-test',
  FRONTEND_ORIGIN: 'http://localhost:5173',
  JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-characters',
};

describe('loadConfig', () => {
  test('normalizes valid configuration', () => {
    expect(loadConfig(validEnvironment)).toMatchObject({
      nodeEnv: 'test',
      isProduction: false,
      port: 3001,
      frontendOrigin: 'http://localhost:5173',
      shutdownTimeoutMs: 10_000,
    });
  });

  test.each(['MONGODB_URI', 'FRONTEND_ORIGIN', 'JWT_ACCESS_SECRET'])('rejects missing %s', (key) => {
    const environment = { ...validEnvironment };
    delete environment[key];
    expect(() => loadConfig(environment)).toThrow(`Missing required environment variable: ${key}`);
  });

  test('rejects wildcard and path-based frontend origins', () => {
    expect(() => loadConfig({ ...validEnvironment, FRONTEND_ORIGIN: '*' })).toThrow();
    expect(() => loadConfig({
      ...validEnvironment,
      FRONTEND_ORIGIN: 'https://example.com/path',
    })).toThrow('FRONTEND_ORIGIN must contain only an HTTP(S) origin');
  });
});
