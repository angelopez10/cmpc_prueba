import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookFilterDto {
  @ApiProperty({ description: 'Término de búsqueda (título, autor, ISBN)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'ID del autor', required: false })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiProperty({ description: 'ID de la editorial', required: false })
  @IsOptional()
  @IsUUID()
  publisherId?: string;

  @ApiProperty({ description: 'ID del género', required: false })
  @IsOptional()
  @IsUUID()
  genreId?: string;

  @ApiProperty({ description: 'Año de publicación mínimo', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  minPublicationYear?: number;

  @ApiProperty({ description: 'Año de publicación máximo', required: false })
  @IsOptional()
  @IsNumber()
  @Max(new Date().getFullYear())
  maxPublicationYear?: number;

  @ApiProperty({ description: 'Precio mínimo', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ description: 'Precio máximo', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ description: 'Solo libros disponibles', required: false })
  @IsOptional()
  @IsBoolean()
  availableOnly?: boolean;

  @ApiProperty({ description: 'Campo de ordenamiento', required: false, enum: ['title', 'price', 'publicationYear', 'createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'price' | 'publicationYear' | 'createdAt' = 'createdAt';

  @ApiProperty({ description: 'Dirección de ordenamiento', required: false, enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({ description: 'Número de página', required: false, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Elementos por página', required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}