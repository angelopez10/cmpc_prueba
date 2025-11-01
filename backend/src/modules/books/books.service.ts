import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual, ILike } from 'typeorm';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Genre } from '../genres/entities/genre.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookFilterDto } from './dto/book-filter.dto';
import { BookResponseDto } from './dto/book-response.dto';
import * as fs from 'fs';
import * as path from 'path';
import { ExportService } from '../../common/services/export.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(Author)
    private authorRepository: Repository<Author>,
    @InjectRepository(Publisher)
    private publisherRepository: Repository<Publisher>,
    @InjectRepository(Genre)
    private genreRepository: Repository<Genre>,
    private readonly exportService: ExportService,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<BookResponseDto> {
    // Verificar que las relaciones existan
    await this.validateRelations(createBookDto);

    // Verificar ISBN único
    if (createBookDto.isbn) {
      const existingBook = await this.bookRepository.findOne({
        where: { isbn: createBookDto.isbn },
        withDeleted: true,
      });
      if (existingBook) {
        throw new ConflictException('El ISBN ya está registrado');
      }
    }

    const book = this.bookRepository.create(createBookDto);
    const saved = await this.bookRepository.save(book);

    // Recargar con relaciones para respuesta consistente
    const savedBook = await this.bookRepository.findOne({
      where: { id: saved.id },
      relations: ['author', 'publisher', 'genre'],
    });

    return this.mapToResponseDto(savedBook as Book);
  }

  async findAll(filterDto: BookFilterDto): Promise<{
    data: BookResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      search,
      authorId,
      publisherId,
      genreId,
      minPrice,
      maxPrice,
      minPublicationYear,
      maxPublicationYear,
      availableOnly,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = filterDto;

    const queryBuilder = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.publisher', 'publisher')
      .leftJoinAndSelect('book.genre', 'genre')
      .where('book.deletedAt IS NULL');

    // Aplicar filtros
    if (search) {
      const likeSearch = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(book.title) LIKE :search OR LOWER(book.isbn) LIKE :search OR LOWER(author.name) LIKE :search OR LOWER(author.lastName) LIKE :search)',
        { search: likeSearch }
      );
    }

    if (authorId) {
      queryBuilder.andWhere('book.authorId = :authorId', { authorId });
    }

    if (publisherId) {
      queryBuilder.andWhere('book.publisherId = :publisherId', { publisherId });
    }

    if (genreId) {
      queryBuilder.andWhere('book.genreId = :genreId', { genreId });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('book.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('book.price <= :maxPrice', { maxPrice });
    }

    if (minPublicationYear !== undefined) {
      queryBuilder.andWhere('book.publicationYear >= :minPublicationYear', { minPublicationYear });
    }

    if (maxPublicationYear !== undefined) {
      queryBuilder.andWhere('book.publicationYear <= :maxPublicationYear', { maxPublicationYear });
    }

    if (availableOnly) {
      queryBuilder.andWhere('book.isAvailable = :availableOnly', { availableOnly });
    }

    // Ordenamiento
    const orderBy = this.getOrderByField(sortBy);
    queryBuilder.orderBy(orderBy, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [books, total] = await queryBuilder.getManyAndCount();

    return {
      data: books.map(book => this.mapToResponseDto(book)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<BookResponseDto> {
    const book = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.publisher', 'publisher')
      .leftJoinAndSelect('book.genre', 'genre')
      .where('book.id = :id AND book.deletedAt IS NULL', { id })
      .getOne();

    if (!book) {
      throw new NotFoundException('Libro no encontrado');
    }

    return this.mapToResponseDto(book);
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<BookResponseDto> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: ['author', 'publisher', 'genre'],
    });

    if (!book) {
      throw new NotFoundException('Libro no encontrado');
    }

    // Verificar relaciones si se están actualizando
    if (updateBookDto.authorId || updateBookDto.publisherId || updateBookDto.genreId) {
      await this.validateRelations({ ...book, ...updateBookDto });
    }

    // Verificar ISBN único si se está actualizando
    if (updateBookDto.isbn && updateBookDto.isbn !== book.isbn) {
      const existingBook = await this.bookRepository.findOne({
        where: { isbn: updateBookDto.isbn },
        withDeleted: true,
      });
      if (existingBook) {
        throw new ConflictException('El ISBN ya está registrado');
      }
    }

    Object.assign(book, updateBookDto);
    const updatedBook = await this.bookRepository.save(book);
    return this.mapToResponseDto(updatedBook);
  }

  async remove(id: string): Promise<{ message: string }> {
    const book = await this.bookRepository.findOne({ where: { id } });

    if (!book) {
      throw new NotFoundException('Libro no encontrado');
    }

    await this.bookRepository.softDelete(id);
    return { message: 'Libro eliminado exitosamente' };
  }

  async uploadImage(id: string, file: any): Promise<{ imageUrl: string }> {
    const book = await this.bookRepository.findOne({ where: { id } });

    if (!book) {
      throw new NotFoundException('Libro no encontrado');
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(process.cwd(), 'uploads', 'books');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const fileName = `${id}-${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadsDir, fileName);

    // Guardar archivo
    fs.writeFileSync(filePath, file.buffer);

    // Actualizar URL de imagen en la base de datos
    const imageUrl = `/uploads/books/${fileName}`;
    book.imageUrl = imageUrl;
    await this.bookRepository.save(book);

    return { imageUrl };
  }

  async exportToCsv(filterDto: BookFilterDto): Promise<Buffer> {
    // Obtener todos los libros sin paginación para exportación
    const { data } = await this.findAll({ ...filterDto, page: 1, limit: 10000 });

    const csvData = data.map(book => ({
      'Título': book.title,
      'Autor': `${book.authorName}`,
      'Editorial': book.publisherName,
      'Género': book.genreName,
      'ISBN': book.isbn || '',
      'Año de Publicación': book.publicationYear || '',
      'Precio': book.price,
      'Stock': book.stockQuantity,
      'Disponible': book.isAvailable ? 'Sí' : 'No',
      'Fecha de Creación': book.createdAt.toISOString().split('T')[0],
    }));

    const headers = [
      'Título',
      'Autor',
      'Editorial',
      'Género',
      'ISBN',
      'Año de Publicación',
      'Precio',
      'Stock',
      'Disponible',
      'Fecha de Creación',
    ];

    return this.exportService.exportToCSV(csvData, headers);
  }

  private async validateRelations(dto: CreateBookDto | UpdateBookDto): Promise<void> {
    if (dto.authorId) {
      const author = await this.authorRepository.findOne({
        where: { id: dto.authorId },
      });
      if (!author) {
        throw new NotFoundException('Autor no encontrado');
      }
    }

    if (dto.publisherId) {
      const publisher = await this.publisherRepository.findOne({
        where: { id: dto.publisherId },
      });
      if (!publisher) {
        throw new NotFoundException('Editorial no encontrada');
      }
    }

    if (dto.genreId) {
      const genre = await this.genreRepository.findOne({
        where: { id: dto.genreId },
      });
      if (!genre) {
        throw new NotFoundException('Género no encontrado');
      }
    }
  }

  private mapToResponseDto(book: Book): BookResponseDto {
    return {
      id: book.id,
      title: book.title,
      description: book.description,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      price: book.price,
      stockQuantity: book.stockQuantity,
      imageUrl: book.imageUrl,
      isAvailable: book.isAvailable,
      authorId: book.authorId,
      publisherId: book.publisherId,
      genreId: book.genreId,
      authorName: book.author ? `${book.author.name} ${book.author.lastName}` : undefined,
      publisherName: book.publisher ? book.publisher.name : undefined,
      genreName: book.genre ? book.genre.name : undefined,
      author: book.author ? { name: book.author.name, lastName: book.author.lastName } : undefined,
      publisher: book.publisher ? { name: book.publisher.name } : undefined,
      genre: book.genre ? { name: book.genre.name } : undefined,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    };
  }

  private getOrderByField(sortBy: string): string {
    const fieldMap = {
      title: 'book.title',
      price: 'book.price',
      publicationYear: 'book.publicationYear',
      createdAt: 'book.createdAt',
    };
    return fieldMap[sortBy] || 'book.createdAt';
  }
}