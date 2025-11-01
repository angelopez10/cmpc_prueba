import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../src/modules/auth/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
      ],
      providers: [
        {
          provide: 'CONFIG_SERVICE',
          useValue: {
            get: (key: string) => {
              const config = {
                JWT_SECRET: 'test-secret-key',
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                DB_USER: 'test',
                DB_PASSWORD: 'test',
                DB_NAME: 'test',
              };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();

    // Limpiar base de datos antes de los tests
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    await userRepository.clear();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.firstName).toBe(registerDto.firstName);
      expect(response.body.user.lastName).toBe(registerDto.lastName);
      expect(response.body.user.role).toBe('user');
    });

    it('should fail when email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toBe('El email ya está registrado');
    });

    it('should fail with invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message.join(' ')).toMatch(/email must be an email/i);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const user = userRepository.create({
        email: 'test@example.com',
        passwordHash: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        isActive: true,
      });
      await userRepository.save(user);
    });

    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(loginDto.email);
    });

    it('should fail with invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('should fail with non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBe('Credenciales inválidas');
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});