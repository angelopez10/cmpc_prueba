import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Genre } from '../genres/entities/genre.entity';
import { ExportService } from '../../common/services/export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Author, Publisher, Genre])],
  controllers: [BooksController],
  providers: [BooksService, ExportService],
  exports: [BooksService],
})
export class BooksModule {}