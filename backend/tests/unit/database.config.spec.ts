import databaseConfig from '../../src/config/database.config';

describe('database.config', () => {
  const OLD = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD };
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.NODE_ENV;
  });
  afterEach(() => {
    process.env = OLD;
  });

  it('should return default postgres config with entities and migrations', () => {
    const cfg = databaseConfig();
    const p: any = cfg;
    expect(p.type).toBe('postgres');
    expect(p.host).toBe('localhost');
    expect(p.port).toBe(5432);
    expect(p.username).toBe('cmpc_user');
    expect(p.password).toBe('cmpc_password');
    expect(p.database).toBe('cmpc_books');
    expect(Array.isArray(p.entities)).toBe(true);
    expect(p.synchronize).toBe(true);
    expect(p.logging).toBe(false);
    expect(p.migrationsRun).toBe(true);
    expect(p.migrations).toEqual(['dist/migrations/*.js']);
    expect(p.ssl).toBe(false);
  });

  it('should set production flags and ssl when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    const cfg = databaseConfig();
    const p: any = cfg;
    expect(p.synchronize).toBe(false);
    expect(p.logging).toBe(false);
    expect(p.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('should read env variables when provided', () => {
    process.env.DB_HOST = 'db';
    process.env.DB_PORT = '6543';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'pass';
    process.env.DB_NAME = 'name';
    const cfg = databaseConfig();
    const p: any = cfg;
    expect(p.host).toBe('db');
    expect(p.port).toBe(6543);
    expect(p.username).toBe('user');
    expect(p.password).toBe('pass');
    expect(p.database).toBe('name');
  });
});