import { Controller, Get, Post, Body, Patch, Put, Param, Delete, Query, UseGuards, UseInterceptors, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ExportService } from '../../common/services/export.service';
import { Response } from 'express';

@ApiTags('Autores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@AuditLog()
@Controller('authors')
export class AuthorsController {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo autor' })
  @ApiResponse({ status: 201, description: 'Autor creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los autores' })
  @ApiResponse({ status: 200, description: 'Lista de autores obtenida exitosamente' })
  async findAll(@Query('search') search?: string) {
    return this.authorsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un autor por ID' })
  @ApiResponse({ status: 200, description: 'Autor obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Autor no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.authorsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un autor' })
  @ApiResponse({ status: 200, description: 'Autor actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Autor no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un autor (soft delete)' })
  @ApiResponse({ status: 200, description: 'Autor eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Autor no encontrado' })
  async remove(@Param('id') id: string) {
    return this.authorsService.remove(id);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar autores a CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV generado exitosamente' })
  async exportToCsv(@Res() res: Response, @Query('search') search?: string) {
    const csvBuffer = await this.authorsService.exportToCsv(search);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=autores.csv');
    res.send(csvBuffer);
  }
}