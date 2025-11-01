import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, Min, Max, Length, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ description: 'Título del libro' })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({ description: 'Descripción del libro', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ISBN del libro', required: false })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  isbn?: string;

  @ApiProperty({ description: 'Año de publicación', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(new Date().getFullYear())
  publicationYear?: number;

  @ApiProperty({ description: 'Precio del libro' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Cantidad en stock', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number = 0;

  @ApiProperty({ description: 'URL de la imagen del libro', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'ID del autor' })
  @IsUUID()
  authorId: string;

  @ApiProperty({ description: 'ID de la editorial' })
  @IsUUID()
  publisherId: string;

  @ApiProperty({ description: 'ID del género' })
  @IsUUID()
  genreId: string;

  @ApiProperty({ description: 'Disponibilidad del libro', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;
}