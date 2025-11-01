import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, UseInterceptors, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PublishersService } from './publishers.service';
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';

import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ExportService } from '../../common/services/export.service';
import { Response } from 'express';

@ApiTags('Editoriales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@AuditLog()
@Controller('publishers')
export class PublishersController {
  constructor(
    private readonly publishersService: PublishersService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva editorial' })
  @ApiResponse({ status: 201, description: 'Editorial creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createPublisherDto: CreatePublisherDto) {
    return this.publishersService.create(createPublisherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las editoriales' })
  @ApiResponse({ status: 200, description: 'Lista de editoriales obtenida exitosamente' })
  async findAll(@Query('search') search?: string) {
    return this.publishersService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una editorial por ID' })
  @ApiResponse({ status: 200, description: 'Editorial obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Editorial no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.publishersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una editorial' })
  @ApiResponse({ status: 200, description: 'Editorial actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Editorial no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updatePublisherDto: UpdatePublisherDto,
  ) {
    return this.publishersService.update(id, updatePublisherDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una editorial (soft delete)' })
  @ApiResponse({ status: 200, description: 'Editorial eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Editorial no encontrada' })
  async remove(@Param('id') id: string) {
    return this.publishersService.remove(id);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar editoriales a CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV generado exitosamente' })
  async exportToCsv(@Res() res: Response, @Query('search') search?: string) {
    const csvBuffer = await this.publishersService.exportToCsv(search);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=editoriales.csv');
    res.send(csvBuffer);
  }
}