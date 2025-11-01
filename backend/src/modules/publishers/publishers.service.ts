import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Publisher } from './entities/publisher.entity';
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { ExportService } from '../../common/services/export.service';

@Injectable()
export class PublishersService {
  constructor(
    @InjectRepository(Publisher)
    private publisherRepository: Repository<Publisher>,
    private readonly exportService: ExportService,
  ) {}

  async create(createPublisherDto: CreatePublisherDto): Promise<Publisher> {
    const publisher = this.publisherRepository.create(createPublisherDto);
    return this.publisherRepository.save(publisher);
  }

  async findAll(search?: string): Promise<Publisher[]> {
    const queryBuilder = this.publisherRepository
      .createQueryBuilder('publisher')
      .where('publisher.deletedAt IS NULL');

    if (search) {
      const likeSearch = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere('LOWER(publisher.name) LIKE :search', { search: likeSearch });
    }

    return queryBuilder.orderBy('publisher.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Publisher> {
    const publisher = await this.publisherRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!publisher) {
      throw new NotFoundException('Editorial no encontrada');
    }

    return publisher;
  }

  async update(id: string, updatePublisherDto: UpdatePublisherDto): Promise<Publisher> {
    const publisher = await this.publisherRepository.findOne({ where: { id } });

    if (!publisher) {
      throw new NotFoundException('Editorial no encontrada');
    }

    Object.assign(publisher, updatePublisherDto);
    return this.publisherRepository.save(publisher);
  }

  async remove(id: string): Promise<{ message: string }> {
    const publisher = await this.publisherRepository.findOne({ where: { id } });

    if (!publisher) {
      throw new NotFoundException('Editorial no encontrada');
    }

    await this.publisherRepository.softDelete(id);
    return { message: 'Editorial eliminada exitosamente' };
  }

  async exportToCsv(search?: string): Promise<Buffer> {
    const publishers = await this.findAll(search);

    const csvData = publishers.map(publisher => ({
      'Nombre': publisher.name,
      'País': publisher.country || '',
      'Año de Fundación': publisher.foundationYear || '',
      'Descripción': publisher.description || '',
      'Sitio Web': publisher.website || '',
      'Fecha de Creación': publisher.createdAt.toISOString().split('T')[0],
    }));

    const headers = [
      'Nombre',
      'País',
      'Año de Fundación',
      'Descripción',
      'Sitio Web',
      'Fecha de Creación',
    ];

    return this.exportService.exportToCSV(csvData, headers);
  }
}