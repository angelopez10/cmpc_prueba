import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../../src/modules/auth/auth.service';
import { User } from '../../src/modules/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const hashedPassword = 'hashedPassword';
      const savedUser = {
        id: 'user-1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: hashedPassword,
        role: 'user',
      };

      const expectedResult = {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
        },
        accessToken: 'mockToken',
      };
mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(savedUser);
      mockRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('mockToken');

      const result = await service.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email }, withDeleted: true });
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(savedUser);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: savedUser.id, email: savedUser.email, role: savedUser.role });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 'user-1',
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: 'user',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
      expect(user.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 'user-1',
        email: loginDto.email,
        password: 'hashedPassword',
      };

      mockRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });


});