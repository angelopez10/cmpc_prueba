import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from '../../src/modules/books/books.controller';
import { BooksService } from '../../src/modules/books/books.service';
import { ExportService } from '../../src/common/services/export.service';
import { Response } from 'express';

describe('BooksController', () => {
  let controller: BooksController;
  let booksService: BooksService;
  let exportService: ExportService;

  const mockBooksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadImage: jest.fn(),
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
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
        {
          provide: ExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    booksService = module.get<BooksService>(BooksService);
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a book successfully', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
        authorId: 'author-1',
        publisherId: 'publisher-1',
        genreId: 'genre-1',
      };

      const createdBook = {
        id: 'book-1',
        ...createBookDto,
      };

      mockBooksService.create.mockResolvedValue(createdBook);

      const result = await controller.create(createBookDto);

      expect(result).toEqual(createdBook);
      expect(booksService.create).toHaveBeenCalledWith(createBookDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated books', async () => {
      const books = {
        data: [{ id: 'book-1', title: 'Test Book' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockBooksService.findAll.mockResolvedValue(books);

      const result = await controller.findAll({ page: 1, limit: 10, sortBy: 'title', sortOrder: 'ASC', search: 'search' });

      expect(result).toEqual(books);
      expect(booksService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, sortBy: 'title', sortOrder: 'ASC', search: 'search' });
    });
  });

  describe('findOne', () => {
    it('should return a book by id', async () => {
      const book = { id: 'book-1', title: 'Test Book' };

      mockBooksService.findOne.mockResolvedValue(book);

      const result = await controller.findOne('book-1');

      expect(result).toEqual(book);
      expect(booksService.findOne).toHaveBeenCalledWith('book-1');
    });
  });

  describe('update', () => {
    it('should update a book successfully', async () => {
      const updateBookDto = { title: 'Updated Title' };
      const updatedBook = { id: 'book-1', ...updateBookDto };

      mockBooksService.update.mockResolvedValue(updatedBook);

      const result = await controller.update('book-1', updateBookDto);

      expect(result).toEqual(updatedBook);
      expect(booksService.update).toHaveBeenCalledWith('book-1', updateBookDto);
    });
  });

  describe('remove', () => {
    it('should remove a book successfully', async () => {
      const result = { message: 'Libro eliminado exitosamente' };

      mockBooksService.remove.mockResolvedValue(result);

      const response = await controller.remove('book-1');

      expect(response).toEqual(result);
      expect(booksService.remove).toHaveBeenCalledWith('book-1');
    });
  });

  describe('uploadImage', () => {
    it('should upload an image successfully', async () => {
      const file = { originalname: 'test.jpg', buffer: Buffer.from('test') } as any;
      const result = { imageUrl: 'http://example.com/image.jpg' };

      mockBooksService.uploadImage.mockResolvedValue(result);

      const response = await controller.uploadImage('book-1', file);

      expect(response).toEqual(result);
      expect(booksService.uploadImage).toHaveBeenCalledWith('book-1', file);
    });
  });

  describe('exportToCsv', () => {
    it('should export books to CSV', async () => {
      const csvBuffer = Buffer.from('CSV data');

      mockBooksService.exportToCsv.mockResolvedValue(csvBuffer);

      const filterDto = { search: 'search' };
      await controller.exportToCsv(filterDto, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=libros.csv');
      expect(mockResponse.send).toHaveBeenCalledWith(csvBuffer);
      expect(booksService.exportToCsv).toHaveBeenCalledWith(filterDto);
    });
  });
});