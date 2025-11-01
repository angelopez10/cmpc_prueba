import { Test, TestingModule } from '@nestjs/testing';
import { GenresController } from '../../src/modules/genres/genres.controller';
import { GenresService } from '../../src/modules/genres/genres.service';
import { ExportService } from '../../src/common/services/export.service';
import { Response } from 'express';

describe('GenresController', () => {
  let controller: GenresController;
  let genresService: GenresService;
  let exportService: ExportService;

  const mockGenresService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    exportToCsv: jest.fn(),
  };

  const mockExportService = {
    exportToCSV: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [
        { provide: GenresService, useValue: mockGenresService },
        { provide: ExportService, useValue: mockExportService },
      ],
    }).compile();

    controller = module.get<GenresController>(GenresController);
    genresService = module.get<GenresService>(GenresService);
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a genre successfully', async () => {
      const dto = { name: 'Fantasía' } as any;
      const created = { id: 'gen-1', ...dto } as any;

      mockGenresService.create.mockResolvedValue(created);

      const result = await controller.create(dto);
      expect(result).toEqual(created);
      expect(genresService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return genres list', async () => {
      const genres = [{ id: 'gen-1', name: 'Fantasía' }];
      mockGenresService.findAll.mockResolvedValue(genres);

      const result = await controller.findAll('fan');
      expect(result).toEqual(genres);
      expect(genresService.findAll).toHaveBeenCalledWith('fan');
    });
  });

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      const genre = { id: 'gen-1', name: 'Fantasía' } as any;
      mockGenresService.findOne.mockResolvedValue(genre);

      const result = await controller.findOne('gen-1');
      expect(result).toEqual(genre);
      expect(genresService.findOne).toHaveBeenCalledWith('gen-1');
    });
  });

  describe('update', () => {
    it('should update genre successfully', async () => {
      const dto = { name: 'Nueva' } as any;
      const updated = { id: 'gen-1', name: 'Nueva' } as any;

      mockGenresService.update.mockResolvedValue(updated);

      const result = await controller.update('gen-1', dto);
      expect(result).toEqual(updated);
      expect(genresService.update).toHaveBeenCalledWith('gen-1', dto);
    });
  });

  describe('remove', () => {
    it('should soft delete genre', async () => {
      const response = { message: 'Género eliminado exitosamente' };
      mockGenresService.remove.mockResolvedValue(response);

      const result = await controller.remove('gen-1');
      expect(result).toEqual(response);
      expect(genresService.remove).toHaveBeenCalledWith('gen-1');
    });
  });

  describe('exportToCsv', () => {
    it('should export genres to CSV', async () => {
      const csvBuffer = Buffer.from('CSV data');
      mockGenresService.exportToCsv.mockResolvedValue(csvBuffer);

      await controller.exportToCsv(mockResponse, 'fan');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=generos.csv');
      expect(mockResponse.send).toHaveBeenCalledWith(csvBuffer);
      expect(genresService.exportToCsv).toHaveBeenCalledWith('fan');
    });
  });
});