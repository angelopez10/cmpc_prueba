import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenresService } from '../../src/modules/genres/genres.service';
import { Genre } from '../../src/modules/genres/entities/genre.entity';
import { ExportService } from '../../src/common/services/export.service';
import { NotFoundException } from '@nestjs/common';

describe('GenresService', () => {
  let service: GenresService;
  let genreRepository: Repository<Genre>;
  let exportService: ExportService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as Repository<Genre>;

  const mockExportService = {
    exportToCSV: jest.fn(),
  } as unknown as ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        { provide: getRepositoryToken(Genre), useValue: mockRepository },
        { provide: ExportService, useValue: mockExportService },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a genre successfully', async () => {
      const dto = { name: 'Fiction', description: 'Desc' } as any;
      const created = { id: 'g-1', ...dto } as any;

      (genreRepository.create as any).mockReturnValue(created);
      (genreRepository.save as any).mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(genreRepository.create).toHaveBeenCalledWith(dto);
      expect(genreRepository.save).toHaveBeenCalledWith(created);
    });
  });

  describe('findAll', () => {
    it('should return genres ordered by name (no search)', async () => {
      const genres = [{ id: 'g-1', name: 'A' }, { id: 'g-2', name: 'B' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(genres),
      };

      (genreRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual(genres);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('genre.deletedAt IS NULL');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('genre.name', 'ASC');
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by search using ILIKE', async () => {
      const genres = [{ id: 'g-1', name: 'Fiction' }];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(genres),
      };

      (genreRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('fic');

      expect(result).toEqual(genres);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('genre.deletedAt IS NULL');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('genre.name ILIKE :search', { search: '%fic%' });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('genre.name', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      const genre = { id: 'g-1', name: 'Fiction', books: [] } as any;
      (genreRepository.findOne as any).mockResolvedValue(genre);

      const result = await service.findOne('g-1');

      expect(result).toEqual(genre);
      expect(genreRepository.findOne).toHaveBeenCalledWith({ where: { id: 'g-1' }, relations: ['books'] });
    });

    it('should throw NotFoundException if genre not found', async () => {
      (genreRepository.findOne as any).mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a genre successfully', async () => {
      const existing = { id: 'g-1', name: 'Fiction', description: 'Old' } as any;
      const dto = { description: 'New' } as any;
      const saved = { ...existing, ...dto } as any;

      (genreRepository.findOne as any).mockResolvedValue(existing);
      (genreRepository.save as any).mockResolvedValue(saved);

      const result = await service.update('g-1', dto);

      expect(result).toEqual(saved);
      expect(genreRepository.findOne).toHaveBeenCalledWith({ where: { id: 'g-1' } });
      expect(genreRepository.save).toHaveBeenCalledWith(saved);
    });

    it('should throw NotFoundException if genre to update not found', async () => {
      (genreRepository.findOne as any).mockResolvedValue(null);

      await expect(service.update('missing', { description: 'x' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a genre successfully', async () => {
      const existing = { id: 'g-1', name: 'Fiction' } as any;
      (genreRepository.findOne as any).mockResolvedValue(existing);

      const result = await service.remove('g-1');

      expect(result).toEqual({ message: 'Género eliminado exitosamente' });
      expect(genreRepository.softDelete).toHaveBeenCalledWith('g-1');
    });

    it('should throw NotFoundException if genre to delete not found', async () => {
      (genreRepository.findOne as any).mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportToCsv', () => {
    it('should export genres to CSV with headers', async () => {
      const genres = [{ name: 'Fiction', description: 'Desc', createdAt: new Date('2020-01-01') }] as any[];
      const buffer = Buffer.from('csv');

      jest.spyOn(service, 'findAll').mockResolvedValue(genres as any);
      (exportService.exportToCSV as any).mockResolvedValue(buffer);

      const result = await service.exportToCsv('fic');

      expect(result).toBe(buffer);
      expect(exportService.exportToCSV).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ 'Nombre': 'Fiction', 'Descripción': 'Desc', 'Fecha de Creación': '2020-01-01' }),
        ]),
        expect.arrayContaining(['Nombre', 'Descripción', 'Fecha de Creación'])
      );
    });

    it('should export genres to CSV and fill empty description with blank string', async () => {
      const genresNoDesc = [{ name: 'NoDesc', createdAt: new Date('2021-05-10') }] as any[];
      const buffer2 = Buffer.from('csv2');

      jest.spyOn(service, 'findAll').mockResolvedValue(genresNoDesc as any);
      (exportService.exportToCSV as any).mockResolvedValue(buffer2);

      const result2 = await service.exportToCsv();

      expect(result2).toBe(buffer2);
      expect(exportService.exportToCSV).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ 'Nombre': 'NoDesc', 'Descripción': '', 'Fecha de Creación': '2021-05-10' }),
        ]),
        expect.arrayContaining(['Nombre', 'Descripción', 'Fecha de Creación'])
      );
    });
  });
});