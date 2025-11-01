import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookFilterDto } from './dto/book-filter.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { Response } from 'express';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ExportService } from '../../common/services/export.service';

@ApiTags('Libros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@AuditLog()
@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo libro' })
  @ApiResponse({ status: 201, description: 'Libro creado exitosamente', type: BookResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'ISBN duplicado' })
  async create(@Body() createBookDto: CreateBookDto): Promise<BookResponseDto> {
    return this.booksService.create(createBookDto);
  }

  @Post('upload-image/:id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Subir imagen de libro' })
  @ApiResponse({ status: 200, description: 'Imagen subida exitosamente' })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /\/(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: any,
  ) {
    return this.booksService.uploadImage(id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los libros con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de libros obtenida exitosamente', type: [BookResponseDto] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'authorId', required: false })
  @ApiQuery({ name: 'publisherId', required: false })
  @ApiQuery({ name: 'genreId', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'availableOnly', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['title', 'price', 'publicationYear', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query() filterDto: BookFilterDto) {
    return this.booksService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un libro por ID' })
  @ApiResponse({ status: 200, description: 'Libro obtenido exitosamente', type: BookResponseDto })
  @ApiResponse({ status: 404, description: 'Libro no encontrado' })
  async findOne(@Param('id') id: string): Promise<BookResponseDto> {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un libro' })
  @ApiResponse({ status: 200, description: 'Libro actualizado exitosamente', type: BookResponseDto })
  @ApiResponse({ status: 404, description: 'Libro no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<BookResponseDto> {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un libro (soft delete)' })
  @ApiResponse({ status: 200, description: 'Libro eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Libro no encontrado' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.booksService.remove(id);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar libros a CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV generado exitosamente' })
  async exportToCsv(@Query() filterDto: BookFilterDto, @Res() res: Response) {
    const csvBuffer = await this.booksService.exportToCsv(filterDto);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=libros.csv');
    res.send(csvBuffer);
  }
}