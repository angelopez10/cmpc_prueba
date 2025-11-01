import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublishersController } from './publishers.controller';
import { PublishersService } from './publishers.service';
import { Publisher } from './entities/publisher.entity';
import { ExportService } from '../../common/services/export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Publisher])],
  controllers: [PublishersController],
  providers: [PublishersService, ExportService],
  exports: [PublishersService],
})
export class PublishersModule {}