import { Controller, Get, Post, Body, Patch, Put, Param, Delete, Query, UseGuards, UseInterceptors, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenresService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { ExportService } from '../../common/services/export.service';
import { Response } from 'express';

import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('Géneros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@AuditLog()
@Controller('genres')
export class GenresController {
  constructor(
    private readonly genresService: GenresService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo género' })
  @ApiResponse({ status: 201, description: 'Género creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createGenreDto: CreateGenreDto) {
    return this.genresService.create(createGenreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los géneros' })
  @ApiResponse({ status: 200, description: 'Lista de géneros obtenida exitosamente' })
  async findAll(@Query('search') search?: string) {
    return this.genresService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un género por ID' })
  @ApiResponse({ status: 200, description: 'Género obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Género no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.genresService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un género' })
  @ApiResponse({ status: 200, description: 'Género actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Género no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    return this.genresService.update(id, updateGenreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un género (soft delete)' })
  @ApiResponse({ status: 200, description: 'Género eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Género no encontrado' })
  async remove(@Param('id') id: string) {
    return this.genresService.remove(id);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar géneros a CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV generado exitosamente' })
  async exportToCsv(@Res() res: Response, @Query('search') search?: string) {
    const csvBuffer = await this.genresService.exportToCsv(search);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=generos.csv');
    res.send(csvBuffer);
  }
}