import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BooksService } from '../../src/modules/books/books.service';
import { Book } from '../../src/modules/books/entities/book.entity';
import { Author } from '../../src/modules/authors/entities/author.entity';
import { Publisher } from '../../src/modules/publishers/entities/publisher.entity';
import { Genre } from '../../src/modules/genres/entities/genre.entity';
import { ExportService } from '../../src/common/services/export.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('BooksService', () => {
  let service: BooksService;
  let bookRepository: Repository<Book>;
  let authorRepository: Repository<Author>;
  let publisherRepository: Repository<Publisher>;
  let genreRepository: Repository<Genre>;
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
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Author),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Publisher),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Genre),
          useValue: mockRepository,
        },
        {
          provide: ExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    bookRepository = module.get<Repository<Book>>(getRepositoryToken(Book));
    authorRepository = module.get<Repository<Author>>(getRepositoryToken(Author));
    publisherRepository = module.get<Repository<Publisher>>(getRepositoryToken(Publisher));
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a book successfully', async () => {
      const createBookDto = {
        title: 'Test Book',
        description: 'Test Description',
        price: 29.99,
        stockQuantity: 10,
        authorId: 'author-1',
        publisherId: 'publisher-1',
        genreId: 'genre-1',
      };

      const author = { id: 'author-1', name: 'John', lastName: 'Doe' };
      const publisher = { id: 'publisher-1', name: 'Test Publisher' };
      const genre = { id: 'genre-1', name: 'Test Genre' };
      const savedBook = {
        id: 'book-1',
        ...createBookDto,
        author,
        publisher,
        genre,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValueOnce(author);
      mockRepository.findOne.mockResolvedValueOnce(publisher);
      mockRepository.findOne.mockResolvedValueOnce(genre);
      mockRepository.create.mockReturnValue(savedBook);
      mockRepository.save.mockResolvedValue(savedBook);

      // Mockear mapToResponseDto
      jest.spyOn(service as any, 'mapToResponseDto').mockReturnValue({
        id: savedBook.id,
        title: savedBook.title,
        authorId: savedBook.authorId,
        publisherId: savedBook.publisherId,
        genreId: savedBook.genreId,
        price: savedBook.price,
        stockQuantity: savedBook.stockQuantity,
        authorName: 'John Doe',
        publisherName: 'Test Publisher',
        genreName: 'Test Genre',
        createdAt: savedBook.createdAt,
        updatedAt: savedBook.updatedAt,
      });

      const result = await service.create(createBookDto);

      expect(result).toEqual({
        id: savedBook.id,
        title: savedBook.title,
        authorId: savedBook.authorId,
        publisherId: savedBook.publisherId,
        genreId: savedBook.genreId,
        price: savedBook.price,
        stockQuantity: savedBook.stockQuantity,
        authorName: 'John Doe',
        publisherName: 'Test Publisher',
        genreName: 'Test Genre',
        createdAt: savedBook.createdAt,
        updatedAt: savedBook.updatedAt,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createBookDto);
      expect(mockRepository.save).toHaveBeenCalledWith(savedBook);
    });

    it('should throw NotFoundException if author not found', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
        authorId: 'nonexistent-author',
        publisherId: 'publisher-1',
        genreId: 'genre-1',
      };

      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createBookDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if publisher not found', async () => {
      const dto: any = { title: 'X', authorId: 'a1', publisherId: 'p-missing', genreId: 'g1' };

      // author ok, publisher missing
      (authorRepository.findOne as any).mockResolvedValueOnce({ id: 'a1' });
      (publisherRepository.findOne as any).mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if genre not found', async () => {
      const dto: any = { title: 'X', authorId: 'a1', publisherId: 'p1', genreId: 'g-missing' };

      (authorRepository.findOne as any).mockResolvedValueOnce({ id: 'a1' });
      (publisherRepository.findOne as any).mockResolvedValueOnce({ id: 'p1' });
      (genreRepository.findOne as any).mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all books with pagination', async () => {
      const books = [
        {
          id: 'book-1',
          title: 'Book 1',
          author: { name: 'Author 1', lastName: 'LastName 1' },
          publisher: { name: 'Publisher 1' },
          genre: { name: 'Genre 1' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mockear mapToResponseDto
      jest.spyOn(service as any, 'mapToResponseDto').mockReturnValue({
        id: books[0].id,
        title: books[0].title,
        authorName: `${books[0].author.name} ${books[0].author.lastName}`,
        publisherName: books[0].publisher.name,
        genreName: books[0].genre.name,
      });

      const result = await service.findAll({ page: 1, limit: 10, sortBy: 'title', sortOrder: 'ASC' });

      expect(result).toEqual({
        data: [{
          id: books[0].id,
          title: books[0].title,
          authorName: `${books[0].author.name} ${books[0].author.lastName}`,
          publisherName: books[0].publisher.name,
          genreName: books[0].genre.name,
        }],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should apply search filter with LOWER LIKE across fields', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      const term = 'Te';
      await service.findAll({ search: term, page: 1, limit: 10, sortBy: 'title', sortOrder: 'ASC' } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(book.title) LIKE :search OR LOWER(book.isbn) LIKE :search OR LOWER(author.name) LIKE :search OR LOWER(author.lastName) LIKE :search)',
        { search: `%${term.toLowerCase()}%` }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('book.title', 'ASC');
    });

    it('should apply authorId, publisherId and genreId filters', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({ authorId: 'a-1', publisherId: 'p-1', genreId: 'g-1', page: 1, limit: 10 } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.authorId = :authorId', { authorId: 'a-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.publisherId = :publisherId', { publisherId: 'p-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.genreId = :genreId', { genreId: 'g-1' });
    });

    it('should apply price range filters', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({ minPrice: 10, maxPrice: 20, page: 2, limit: 5 } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.price >= :minPrice', { minPrice: 10 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.price <= :maxPrice', { maxPrice: 20 });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith((2 - 1) * 5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should apply publication year range filters', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({ minPublicationYear: 2000, maxPublicationYear: 2020, page: 1, limit: 10 } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.publicationYear >= :minPublicationYear', { minPublicationYear: 2000 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.publicationYear <= :maxPublicationYear', { maxPublicationYear: 2020 });
    });

    it('should apply availableOnly filter', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({ availableOnly: true, page: 1, limit: 10 } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.isAvailable = :availableOnly', { availableOnly: true });
    });

    it('should use default sortBy createdAt DESC and default pagination when not provided', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({} as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('book.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith((1 - 1) * 10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply descending order when sortOrder=DESC', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({ sortBy: 'title', sortOrder: 'DESC', page: 1, limit: 10 } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('book.title', 'DESC');
    });
  });
  describe('findOne', () => {
    it('should return a book by id', async () => {
      const book = {
        id: 'book-1',
        title: 'Test Book',
        author: { name: 'Author 1', lastName: 'LastName 1' },
        publisher: { name: 'Publisher 1' },
        genre: { name: 'Genre 1' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(book),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mockear mapToResponseDto
      jest.spyOn(service as any, 'mapToResponseDto').mockReturnValue({
        id: book.id,
        title: book.title,
        authorName: `${book.author.name} ${book.author.lastName}`,
        publisherName: book.publisher.name,
        genreName: book.genre.name,
      });

      const result = await service.findOne('book-1');

      expect(result).toEqual({
        id: book.id,
        title: book.title,
        authorName: `${book.author.name} ${book.author.lastName}`,
        publisherName: book.publisher.name,
        genreName: book.genre.name,
      });
    });

    it('should throw NotFoundException if book not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findOne('nonexistent-book')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a book successfully', async () => {
      const updateBookDto = { title: 'Updated Title', price: 39.99 };
      const existingBook = {
        id: 'book-1',
        title: 'Original Title',
        price: 29.99,
        author: { name: 'Author 1', lastName: 'LastName 1' },
        publisher: { name: 'Publisher 1' },
        genre: { name: 'Genre 1' },
      };
      const updatedBook = { ...existingBook, ...updateBookDto };

      mockRepository.findOne.mockResolvedValue(existingBook);
      mockRepository.save.mockResolvedValue(updatedBook);

      // Mockear mapToResponseDto
      jest.spyOn(service as any, 'mapToResponseDto').mockReturnValue({
        id: updatedBook.id,
        title: updatedBook.title,
        authorName: `${updatedBook.author.name} ${updatedBook.author.lastName}`,
        publisherName: updatedBook.publisher.name,
        genreName: updatedBook.genre.name,
      });

      const result = await service.update('book-1', updateBookDto);

      expect(result).toEqual({
        id: updatedBook.id,
        title: updatedBook.title,
        authorName: `${updatedBook.author.name} ${updatedBook.author.lastName}`,
        publisherName: updatedBook.publisher.name,
        genreName: updatedBook.genre.name,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBook);
    });

    it('should throw NotFoundException if book not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-book', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a book successfully', async () => {
      const book = { id: 'book-1', title: 'Test Book' };

      mockRepository.findOne.mockResolvedValue(book);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('book-1');

      expect(result).toEqual({ message: 'Libro eliminado exitosamente' });
      expect(mockRepository.softDelete).toHaveBeenCalledWith('book-1');
    });

    it('should throw NotFoundException if book not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-book')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportToCsv', () => {
    it('should export books to CSV', async () => {
      const books = {
        data: [
          {
            id: 'book-1',
            title: 'Book 1',
            authorName: 'Author 1 Doe',
            publisherName: 'Publisher 1',
            genreName: 'Genre 1',
            authorId: 'author-1',
            publisherId: 'publisher-1',
            genreId: 'genre-1',
            price: 29.99,
            stockQuantity: 10,
            isAvailable: true,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(books);
      mockExportService.exportToCSV.mockResolvedValue(Buffer.from('CSV data'));

      const result = await service.exportToCsv({ search: '', sortBy: 'title', sortOrder: 'ASC' });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockExportService.exportToCSV).toHaveBeenCalled();
    });
  });
  describe('findAll', () => {
    it('should order by price when sortBy=price', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({ sortBy: 'price', sortOrder: 'ASC', page: 1, limit: 10 } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('book.price', 'ASC');
    });

    it('should order by publicationYear when sortBy=publicationYear', async () => {
      const books: any[] = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([books, 0]),
      };
      (bookRepository.createQueryBuilder as any).mockReturnValue(mockQueryBuilder);

      await service.findAll({ sortBy: 'publicationYear', sortOrder: 'DESC', page: 1, limit: 10 } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('book.publicationYear', 'DESC');
    });
  });
  describe('update', () => {
    it('should throw ConflictException when updating isbn to an existing one', async () => {
      const existingBook: any = { id: 'book-1', isbn: 'old', author: {}, publisher: {}, genre: {} };
      const updateDto: any = { isbn: 'dup' };

      (bookRepository.findOne as any).mockResolvedValueOnce(existingBook); // fetch current
      (bookRepository.findOne as any).mockResolvedValueOnce({ id: 'other', isbn: 'dup' }); // isbn check

      await expect(service.update('book-1', updateDto)).rejects.toThrow(ConflictException);
    });
  });
  describe('mapToResponseDto', () => {
    it('should return undefined relation fields when relations missing', () => {
      const raw: any = {
        id: 'b1',
        title: 'T',
        price: 1,
        stockQuantity: 1,
        isAvailable: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const dto = (service as any).mapToResponseDto(raw);
      expect(dto.authorName).toBeUndefined();
      expect(dto.publisherName).toBeUndefined();
      expect(dto.genreName).toBeUndefined();
      expect(dto.author).toBeUndefined();
      expect(dto.publisher).toBeUndefined();
      expect(dto.genre).toBeUndefined();
    });

    it('should compute names when relations present', () => {
      const raw: any = {
        id: 'b1',
        title: 'T',
        author: { name: 'A', lastName: 'B' },
        publisher: { name: 'P' },
        genre: { name: 'G' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const dto = (service as any).mapToResponseDto(raw);
      expect(dto.authorName).toBe('A B');
      expect(dto.publisherName).toBe('P');
      expect(dto.genreName).toBe('G');
      expect(dto.author).toEqual({ name: 'A', lastName: 'B' });
      expect(dto.publisher).toEqual({ name: 'P' });
      expect(dto.genre).toEqual({ name: 'G' });
    });
  });
});