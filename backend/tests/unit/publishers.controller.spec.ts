import { Test, TestingModule } from '@nestjs/testing';
import { PublishersController } from '../../src/modules/publishers/publishers.controller';
import { PublishersService } from '../../src/modules/publishers/publishers.service';
import { ExportService } from '../../src/common/services/export.service';
import { Response } from 'express';

describe('PublishersController', () => {
  let controller: PublishersController;
  let publishersService: PublishersService;
  let exportService: ExportService;

  const mockPublishersService = {
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
      controllers: [PublishersController],
      providers: [
        { provide: PublishersService, useValue: mockPublishersService },
        { provide: ExportService, useValue: mockExportService },
      ],
    }).compile();

    controller = module.get<PublishersController>(PublishersController);
    publishersService = module.get<PublishersService>(PublishersService);
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a publisher successfully', async () => {
      const dto = { name: 'Editorial Test' } as any;
      const created = { id: 'pub-1', ...dto } as any;

      mockPublishersService.create.mockResolvedValue(created);

      const result = await controller.create(dto);
      expect(result).toEqual(created);
      expect(publishersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return publishers list', async () => {
      const publishers = [{ id: 'pub-1', name: 'Editorial' }];
      mockPublishersService.findAll.mockResolvedValue(publishers);

      const result = await controller.findAll('ed');
      expect(result).toEqual(publishers);
      expect(publishersService.findAll).toHaveBeenCalledWith('ed');
    });
  });

  describe('findOne', () => {
    it('should return a publisher by id', async () => {
      const publisher = { id: 'pub-1', name: 'Editorial' } as any;
      mockPublishersService.findOne.mockResolvedValue(publisher);

      const result = await controller.findOne('pub-1');
      expect(result).toEqual(publisher);
      expect(publishersService.findOne).toHaveBeenCalledWith('pub-1');
    });
  });

  describe('update', () => {
    it('should update publisher successfully', async () => {
      const dto = { name: 'New' } as any;
      const updated = { id: 'pub-1', name: 'New' } as any;

      mockPublishersService.update.mockResolvedValue(updated);

      const result = await controller.update('pub-1', dto);
      expect(result).toEqual(updated);
      expect(publishersService.update).toHaveBeenCalledWith('pub-1', dto);
    });
  });

  describe('remove', () => {
    it('should soft delete publisher', async () => {
      const response = { message: 'Editorial eliminada exitosamente' };
      mockPublishersService.remove.mockResolvedValue(response);

      const result = await controller.remove('pub-1');
      expect(result).toEqual(response);
      expect(publishersService.remove).toHaveBeenCalledWith('pub-1');
    });
  });

  describe('exportToCsv', () => {
    it('should export publishers to CSV', async () => {
      const csvBuffer = Buffer.from('CSV data');
      mockPublishersService.exportToCsv.mockResolvedValue(csvBuffer);

      await controller.exportToCsv(mockResponse, 'ed');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=editoriales.csv');
      expect(mockResponse.send).toHaveBeenCalledWith(csvBuffer);
      expect(publishersService.exportToCsv).toHaveBeenCalledWith('ed');
    });
  });
});