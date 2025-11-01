import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../src/modules/auth/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from '../../src/modules/books/entities/book.entity';
import { Author } from '../../src/modules/authors/entities/author.entity';
import { Publisher } from '../../src/modules/publishers/entities/publisher.entity';
import { Genre } from '../../src/modules/genres/entities/genre.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { BooksModule } from '../../src/modules/books/books.module';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('BooksController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authorRepository: Repository<Author>;
  let publisherRepository: Repository<Publisher>;
  let genreRepository: Repository<Genre>;
  let bookRepository: Repository<Book>;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Book, Author, Publisher, Genre],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        BooksModule,
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

    // Activar ValidationPipe global similar a main.ts
    app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authorRepository = moduleFixture.get<Repository<Author>>(getRepositoryToken(Author));
    publisherRepository = moduleFixture.get<Repository<Publisher>>(getRepositoryToken(Publisher));
    genreRepository = moduleFixture.get<Repository<Genre>>(getRepositoryToken(Genre));
    bookRepository = moduleFixture.get<Repository<Book>>(getRepositoryToken(Book));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await bookRepository.clear();
    await authorRepository.clear();
    await publisherRepository.clear();
    await genreRepository.clear();
    await userRepository.clear();

    // Create test user and login
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = userRepository.create({
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(user);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' })
      .expect(200);

    authToken = loginResponse.body.accessToken;
  });

  describe('/books (POST)', () => {
    it('should create a new book successfully', async () => {
      // Create related entities
      const author = authorRepository.create({ name: 'Test Author', lastName: 'Last Name', nationality: 'Test', birthDate: new Date() });
      const savedAuthor = await authorRepository.save(author);

      const publisher = publisherRepository.create({ name: 'Test Publisher', country: 'Test', foundationYear: 2000 });
      const savedPublisher = await publisherRepository.save(publisher);

      const genre = genreRepository.create({ name: 'Test Genre', description: 'Test description' });
      const savedGenre = await genreRepository.save(genre);

      const createBookDto = {
        title: 'Test Book',
        description: 'Test description',
        isbn: '1234567890',
        publicationYear: 2023,
        price: 29.99,
        stockQuantity: 10,
        authorId: savedAuthor.id,
        publisherId: savedPublisher.id,
        genreId: savedGenre.id,
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBookDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createBookDto.title);
      expect(response.body.author.name).toBe('Test Author');
      expect(response.body.publisher.name).toBe('Test Publisher');
      expect(response.body.genre.name).toBe('Test Genre');
    });

    it('should fail when required fields are missing', async () => {
      const invalidBookDto = {
        title: 'Test Book',
        // Missing required fields
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBookDto)
        .expect(400);

      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message.join(' ')).toMatch(/price must be a number conforming to the specified constraints/);
      expect(response.body.message.join(' ')).toMatch(/authorId must be a UUID/);
      expect(response.body.message.join(' ')).toMatch(/publisherId must be a UUID/);
      expect(response.body.message.join(' ')).toMatch(/genreId must be a UUID/);
    });
  });

  describe('/books (GET)', () => {
    beforeEach(async () => {
      // Create test data
      const author = authorRepository.create({ name: 'Test Author', lastName: 'Last Name', nationality: 'Test', birthDate: new Date() });
      const savedAuthor = await authorRepository.save(author);

      const publisher = publisherRepository.create({ name: 'Test Publisher', country: 'Test', foundationYear: 2000 });
      const savedPublisher = await publisherRepository.save(publisher);

      const genre = genreRepository.create({ name: 'Test Genre', description: 'Test description' });
      const savedGenre = await genreRepository.save(genre);

      const book1 = bookRepository.create({
        title: 'Test Book 1',
        price: 29.99,
        stockQuantity: 10,
        authorId: savedAuthor.id,
        publisherId: savedPublisher.id,
        genreId: savedGenre.id,
        isAvailable: true,
      });

      const book2 = bookRepository.create({
        title: 'Test Book 2',
        price: 39.99,
        stockQuantity: 5,
        authorId: savedAuthor.id,
        publisherId: savedPublisher.id,
        genreId: savedGenre.id,
        isAvailable: true,
      });

      await bookRepository.save([book1, book2]);
    });

    it('should return paginated books', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should filter books by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?search=Test Book 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Book 1');
    });

    it('should sort books by price', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?sortBy=price&sortOrder=ASC')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data[0].price).toBe(29.99);
      expect(response.body.data[1].price).toBe(39.99);
    });
  });

  describe('/books/:id (GET)', () => {
    it('should return a book by id', async () => {
      // Create test data
      const author = authorRepository.create({ name: 'Test Author', lastName: 'Last Name', nationality: 'Test', birthDate: new Date() });
      const savedAuthor = await authorRepository.save(author);

      const publisher = publisherRepository.create({ name: 'Test Publisher', country: 'Test', foundationYear: 2000 });
      const savedPublisher = await publisherRepository.save(publisher);

      const genre = genreRepository.create({ name: 'Test Genre', description: 'Test description' });
      const savedGenre = await genreRepository.save(genre);

      const book = bookRepository.create({
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
        authorId: savedAuthor.id,
        publisherId: savedPublisher.id,
        genreId: savedGenre.id,
      });
      const savedBook = await bookRepository.save(book);

      const response = await request(app.getHttpServer())
        .get(`/books/${savedBook.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', savedBook.id);
      expect(response.body.title).toBe('Test Book');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Libro no encontrado');
    });
  });

  describe('/books/:id (PATCH)', () => {
    it('should update a book successfully', async () => {
      // Create test data
      const author = authorRepository.create({ name: 'Test Author', lastName: 'Last Name', nationality: 'Test', birthDate: new Date() });
      const savedAuthor = await authorRepository.save(author);

      const publisher = publisherRepository.create({ name: 'Test Publisher', country: 'Test', foundationYear: 2000 });
      const savedPublisher = await publisherRepository.save(publisher);

      const genre = genreRepository.create({ name: 'Test Genre', description: 'Test description' });
      const savedGenre = await genreRepository.save(genre);

      const book = bookRepository.create({
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
        authorId: savedAuthor.id,
        publisherId: savedPublisher.id,
        genreId: savedGenre.id,
      });
      const savedBook = await bookRepository.save(book);

      const updateBookDto = {
        title: 'Updated Title',
        price: 34.99,
      };

      const response = await request(app.getHttpServer())
        .patch(`/books/${savedBook.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateBookDto)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.price).toBe(34.99);
    });
  });

  describe('/books/:id (DELETE)', () => {
    it('should soft delete a book successfully', async () => {
      // Create test data
      const author = authorRepository.create({ name: 'Test Author', lastName: 'Last Name', nationality: 'Test', birthDate: new Date() });
      const savedAuthor = await authorRepository.save(author);

      const publisher = publisherRepository.create({ name: 'Test Publisher', country: 'Test', foundationYear: 2000 });
      const savedPublisher = await publisherRepository.save(publisher);

      const genre = genreRepository.create({ name: 'Test Genre', description: 'Test description' });
      const savedGenre = await genreRepository.save(genre);

      const book = bookRepository.create({
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
        authorId: savedAuthor.id,
        publisherId: savedPublisher.id,
        genreId: savedGenre.id,
      });
      const savedBook = await bookRepository.save(book);

      const response = await request(app.getHttpServer())
        .delete(`/books/${savedBook.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Libro eliminado exitosamente');

      // Verify book is soft deleted
      const deletedBook = await bookRepository.findOne({ where: { id: savedBook.id }, withDeleted: true });
      expect(deletedBook.deletedAt).toBeDefined();
    });
  });
});