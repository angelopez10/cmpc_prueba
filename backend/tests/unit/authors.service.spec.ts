import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorsService } from '../../src/modules/authors/authors.service';
import { Author } from '../../src/modules/authors/entities/author.entity';
import { ExportService } from '../../src/common/services/export.service';
import { NotFoundException } from '@nestjs/common';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let authorRepository: Repository<Author>;
  let exportService: ExportService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockExportService = {
    exportToCSV: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getRepositoryToken(Author),
          useValue: mockRepository,
        },
        {
          provide: ExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    authorRepository = module.get<Repository<Author>>(getRepositoryToken(Author));
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an author successfully', async () => {
      const createAuthorDto = {
        name: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        biography: 'Test biography',
        nationality: 'American',
      };

      const savedAuthor = {
        id: 'author-1',
        ...createAuthorDto,
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedAuthor);
      mockRepository.save.mockResolvedValue(savedAuthor);

      const result = await service.create(createAuthorDto);

      expect(result).toEqual(savedAuthor);
      expect(mockRepository.create).toHaveBeenCalledWith(createAuthorDto);
      expect(mockRepository.save).toHaveBeenCalledWith(savedAuthor);
    });
  });

  describe('findAll', () => {
    it('should return all authors with search', async () => {
      const authors = [
        {
          id: 'author-1',
          name: 'John',
          lastName: 'Doe',
          birthDate: new Date('1990-01-01'),
          nationality: 'American',
          createdAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(authors),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('John');

      expect(result).toEqual(authors);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('author.deletedAt IS NULL');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(author.name) LIKE :search OR LOWER(author.lastName) LIKE :search)',
        { search: '%john%' }
      );
    });

    it('should return all authors without search', async () => {
      const authors = [
        {
          id: 'author-1',
          name: 'John',
          lastName: 'Doe',
          birthDate: new Date('1990-01-01'),
          nationality: 'American',
          createdAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(authors),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual(authors);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an author by id', async () => {
      const author = {
        id: 'author-1',
        name: 'John',
        lastName: 'Doe',
        birthDate: new Date('1990-01-01'),
        books: [],
      };

      mockRepository.findOne.mockResolvedValue(author);

      const result = await service.findOne('author-1');

      expect(result).toEqual(author);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'author-1' },
        relations: ['books'],
      });
    });

    it('should throw NotFoundException if author not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-author')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an author successfully', async () => {
      const updateAuthorDto = { name: 'Jane' };
      const existingAuthor = {
        id: 'author-1',
        name: 'John',
        lastName: 'Doe',
      };
      const updatedAuthor = { ...existingAuthor, ...updateAuthorDto };

      mockRepository.findOne.mockResolvedValue(existingAuthor);
      mockRepository.save.mockResolvedValue(updatedAuthor);

      const result = await service.update('author-1', updateAuthorDto);

      expect(result).toEqual(updatedAuthor);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedAuthor);
    });

    it('should throw NotFoundException if author not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-author', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an author successfully', async () => {
      const author = { id: 'author-1', name: 'John', lastName: 'Doe' };

      mockRepository.findOne.mockResolvedValue(author);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('author-1');

      expect(result).toEqual({ message: 'Autor eliminado exitosamente' });
      expect(mockRepository.softDelete).toHaveBeenCalledWith('author-1');
    });

    it('should throw NotFoundException if author not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-author')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportToCsv', () => {
    it('should export authors to CSV', async () => {
      const authors = [
        {
          id: 'author-1',
          name: 'John',
          lastName: 'Doe',
          birthDate: new Date('1990-01-01'),
          biography: 'Test bio',
          nationality: 'American',
          createdAt: new Date('2023-01-01'),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(authors),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockExportService.exportToCSV.mockResolvedValue(Buffer.from('CSV data'));

      const result = await service.exportToCsv();

      expect(result).toBeInstanceOf(Buffer);
      expect(mockExportService.exportToCSV).toHaveBeenCalled();
    });
  });
});