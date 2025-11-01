import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PublishersService } from '../../src/modules/publishers/publishers.service';
import { Publisher } from '../../src/modules/publishers/entities/publisher.entity';
import { ExportService } from '../../src/common/services/export.service';

describe('PublishersService', () => {
  let service: PublishersService;
  let publisherRepository: Repository<Publisher>;
  let exportService: ExportService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as Repository<Publisher>;

  const mockExportService = {
    exportToCSV: jest.fn(),
  } as unknown as ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishersService,
        { provide: getRepositoryToken(Publisher), useValue: mockRepository },
        { provide: ExportService, useValue: mockExportService },
      ],
    }).compile();

    service = module.get<PublishersService>(PublishersService);
    publisherRepository = module.get<Repository<Publisher>>(getRepositoryToken(Publisher));
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a publisher successfully', async () => {
      const dto = { name: 'Editorial Test', country: 'Chile' } as any;
      const created = { id: 'pub-1', ...dto } as any;

      (publisherRepository.create as any).mockReturnValue(created);
      (publisherRepository.save as any).mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(publisherRepository.create).toHaveBeenCalledWith(dto);
      expect(publisherRepository.save).toHaveBeenCalledWith(created);
    });
  });

  describe('findAll', () => {
    it('should return publishers ordered by name (no search)', async () => {
      const publishers = [{ id: 'pub-1', name: 'A' }, { id: 'pub-2', name: 'B' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(publishers),
      };

      (publisherRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual(publishers);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('publisher.deletedAt IS NULL');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('publisher.name', 'ASC');
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by search when provided', async () => {
      const publishers = [{ id: 'pub-1', name: 'Test' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(publishers),
      };

      (publisherRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('te');

      expect(result).toEqual(publishers);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(publisher.name) LIKE :search', { search: '%te%' });
    });
  });

  describe('exportToCsv', () => {
    it('should export publishers to CSV with missing optional fields', async () => {
      const publishers = [
        { id: 'pub-2', name: 'No Opts', country: undefined, foundationYear: undefined, description: undefined, website: undefined, createdAt: new Date('2021-01-01') },
      ] as any[];
      const buffer = Buffer.from('csv2');

      jest.spyOn(service, 'findAll').mockResolvedValue(publishers as any);
      (exportService.exportToCSV as any).mockResolvedValue(buffer);

      const result = await service.exportToCsv();
      expect(result).toBe(buffer);
      expect(exportService.exportToCSV).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            'Nombre': 'No Opts',
            'País': '',
            'Año de Fundación': '',
            'Descripción': '',
            'Sitio Web': '',
            'Fecha de Creación': '2021-01-01',
          })
        ]),
        expect.arrayContaining([
          'Nombre',
          'País',
          'Año de Fundación',
          'Descripción',
          'Sitio Web',
          'Fecha de Creación',
        ])
      );
    });
  });

  describe('findOne', () => {
    it('should return publisher by id', async () => {
      const publisher = { id: 'pub-1', name: 'Editorial' } as any;
      (publisherRepository.findOne as any).mockResolvedValue(publisher);

      const result = await service.findOne('pub-1');
      expect(result).toEqual(publisher);
      expect(publisherRepository.findOne).toHaveBeenCalledWith({ where: { id: 'pub-1' }, relations: ['books'] });
    });

    it('should throw NotFoundException when publisher not found', async () => {
      (publisherRepository.findOne as any).mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update publisher successfully', async () => {
      const existing = { id: 'pub-1', name: 'Old' } as any;
      const dto = { name: 'New' } as any;
      const saved = { id: 'pub-1', name: 'New' } as any;

      (publisherRepository.findOne as any).mockResolvedValue(existing);
      (publisherRepository.save as any).mockResolvedValue(saved);

      const result = await service.update('pub-1', dto);
      expect(result).toEqual(saved);
      expect(publisherRepository.save).toHaveBeenCalledWith({ ...existing, ...dto });
    });

    it('should throw NotFoundException when updating missing publisher', async () => {
      (publisherRepository.findOne as any).mockResolvedValue(null);
      await expect(service.update('missing', { name: 'X' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete publisher', async () => {
      const existing = { id: 'pub-1', name: 'Old' } as any;
      (publisherRepository.findOne as any).mockResolvedValue(existing);
      (publisherRepository.softDelete as any).mockResolvedValue({});

      const result = await service.remove('pub-1');
      expect(result).toEqual({ message: 'Editorial eliminada exitosamente' });
      expect(publisherRepository.softDelete).toHaveBeenCalledWith('pub-1');
    });

    it('should throw NotFoundException when deleting missing publisher', async () => {
      (publisherRepository.findOne as any).mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportToCsv', () => {
    it('should export publishers to CSV', async () => {
      const publishers = [
        { id: 'pub-1', name: 'Editorial', country: 'CL', foundationYear: 2000, description: 'Desc', website: 'http://x', createdAt: new Date('2020-01-01') },
      ] as any[];
      const buffer = Buffer.from('csv');

      jest.spyOn(service, 'findAll').mockResolvedValue(publishers as any);
      (exportService.exportToCSV as any).mockResolvedValue(buffer);

      const result = await service.exportToCsv('ed');
      expect(result).toBe(buffer);
      expect(exportService.exportToCSV).toHaveBeenCalledWith(
        expect.any(Array),
        expect.arrayContaining([
          'Nombre',
          'País',
          'Año de Fundación',
          'Descripción',
          'Sitio Web',
          'Fecha de Creación',
        ])
      );
    });
  });
});