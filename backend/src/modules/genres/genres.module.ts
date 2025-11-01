import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { ExportService } from '../../common/services/export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Genre])],
  controllers: [GenresController],
  providers: [GenresService, ExportService],
  exports: [GenresService],
})
export class GenresModule {}