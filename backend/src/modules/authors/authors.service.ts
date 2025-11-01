import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { ExportService } from '../../common/services/export.service';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private authorRepository: Repository<Author>,
    private readonly exportService: ExportService,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    const author = this.authorRepository.create(createAuthorDto);
    return this.authorRepository.save(author);
  }

  async findAll(search?: string): Promise<Author[]> {
    const queryBuilder = this.authorRepository
      .createQueryBuilder('author')
      .where('author.deletedAt IS NULL');

    if (search) {
      const likeSearch = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(author.name) LIKE :search OR LOWER(author.lastName) LIKE :search)',
        { search: likeSearch }
      );
    }

    return queryBuilder.orderBy('author.lastName', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.authorRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!author) {
      throw new NotFoundException('Autor no encontrado');
    }

    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    const author = await this.authorRepository.findOne({ where: { id } });

    if (!author) {
      throw new NotFoundException('Autor no encontrado');
    }

    Object.assign(author, updateAuthorDto);
    return this.authorRepository.save(author);
  }

  async remove(id: string): Promise<{ message: string }> {
    const author = await this.authorRepository.findOne({ where: { id } });

    if (!author) {
      throw new NotFoundException('Autor no encontrado');
    }

    await this.authorRepository.softDelete(id);
    return { message: 'Autor eliminado exitosamente' };
  }

  async exportToCsv(search?: string): Promise<Buffer> {
    const authors = await this.findAll(search);

    const csvData = authors.map(author => ({
      'Nombre': author.name,
      'Apellido': author.lastName,
      'Fecha de Nacimiento': author.birthDate ? author.birthDate.toISOString().split('T')[0] : '',
      'Nacionalidad': author.nationality || '',
      'Biografía': author.biography || '',
      'Fecha de Creación': author.createdAt.toISOString().split('T')[0],
    }));

    const headers = [
      'Nombre',
      'Apellido',
      'Fecha de Nacimiento',
      'Biografía',
      'Nacionalidad',
      'Fecha de Creación',
    ];

    return this.exportService.exportToCSV(csvData, headers);
  }
}