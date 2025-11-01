import { ApiProperty } from '@nestjs/swagger';

export class BookResponseDto {
  @ApiProperty({ description: 'ID del libro' })
  id: string;

  @ApiProperty({ description: 'Título del libro' })
  title: string;

  @ApiProperty({ description: 'Descripción del libro' })
  description?: string;

  @ApiProperty({ description: 'ISBN del libro' })
  isbn?: string;

  @ApiProperty({ description: 'Año de publicación' })
  publicationYear?: number;

  @ApiProperty({ description: 'Precio del libro' })
  price: number;

  @ApiProperty({ description: 'Cantidad en stock' })
  stockQuantity: number;

  @ApiProperty({ description: 'URL de la imagen del libro' })
  imageUrl?: string;

  @ApiProperty({ description: 'Disponibilidad del libro' })
  isAvailable: boolean;

  @ApiProperty({ description: 'ID del autor' })
  authorId: string;

  @ApiProperty({ description: 'ID de la editorial' })
  publisherId: string;

  @ApiProperty({ description: 'ID del género' })
  genreId: string;

  @ApiProperty({ description: 'Nombre del autor' })
  authorName?: string;

  @ApiProperty({ description: 'Nombre de la editorial' })
  publisherName?: string;

  @ApiProperty({ description: 'Nombre del género' })
  genreName?: string;

  @ApiProperty({ description: 'Autor relacionado' })
  author?: { name: string; lastName?: string };

  @ApiProperty({ description: 'Editorial relacionada' })
  publisher?: { name: string };

  @ApiProperty({ description: 'Género relacionado' })
  genre?: { name: string };

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}