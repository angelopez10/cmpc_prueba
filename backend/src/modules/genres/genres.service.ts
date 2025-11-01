import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { ExportService } from '../../common/services/export.service';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private genreRepository: Repository<Genre>,
    private readonly exportService: ExportService,
  ) {}

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    const genre = this.genreRepository.create(createGenreDto);
    return this.genreRepository.save(genre);
  }

  async findAll(search?: string): Promise<Genre[]> {
    const queryBuilder = this.genreRepository
      .createQueryBuilder('genre')
      .where('genre.deletedAt IS NULL');

    if (search) {
      queryBuilder.andWhere('genre.name ILIKE :search', { search: `%${search}%` });
    }

    return queryBuilder.orderBy('genre.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Genre> {
    const genre = await this.genreRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!genre) {
      throw new NotFoundException('Género no encontrado');
    }

    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto): Promise<Genre> {
    const genre = await this.genreRepository.findOne({ where: { id } });

    if (!genre) {
      throw new NotFoundException('Género no encontrado');
    }

    Object.assign(genre, updateGenreDto);
    return this.genreRepository.save(genre);
  }

  async remove(id: string): Promise<{ message: string }> {
    const genre = await this.genreRepository.findOne({ where: { id } });

    if (!genre) {
      throw new NotFoundException('Género no encontrado');
    }

    await this.genreRepository.softDelete(id);
    return { message: 'Género eliminado exitosamente' };
  }

  async exportToCsv(search?: string): Promise<Buffer> {
    const genres = await this.findAll(search);

    const csvData = genres.map(genre => ({
      'Nombre': genre.name,
      'Descripción': genre.description || '',
      'Fecha de Creación': genre.createdAt.toISOString().split('T')[0],
    }));

    const headers = [
      'Nombre',
      'Descripción',
      'Fecha de Creación',
    ];

    return this.exportService.exportToCSV(csvData, headers);
  }
}