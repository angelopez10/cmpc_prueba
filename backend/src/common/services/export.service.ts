import { Injectable } from '@nestjs/common';
import * as csv from 'fast-csv';
import { Stream } from 'stream';

@Injectable()
export class ExportService {
  async exportToCSV(data: any[], headers: string[]): Promise<Buffer> {
    const stream = new Stream.PassThrough();
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);

      const csvStream = csv.format({ headers });
      csvStream.pipe(stream);

      data.forEach((row) => {
        csvStream.write(row);
      });

      csvStream.end();
    });
  }

  formatBooksForExport(books: any[]): any[] {
    return books.map(book => ({
      'Título': book.title,
      'Descripción': book.description || '',
      'ISBN': book.isbn || '',
      'Año de Publicación': book.publicationYear || '',
      'Precio': book.price,
      'Stock': book.stockQuantity,
      'Disponible': book.isAvailable ? 'Sí' : 'No',
      'Autor': `${book.author?.firstName} ${book.author?.lastName}`.trim(),
      'Editorial': book.publisher?.name || '',
      'Género': book.genre?.name || '',
      'Fecha de Creación': book.createdAt?.toISOString().split('T')[0] || '',
      'Fecha de Actualización': book.updatedAt?.toISOString().split('T')[0] || '',
    }));
  }

  formatAuthorsForExport(authors: any[]): any[] {
    return authors.map(author => ({
      'Nombre': author.firstName,
      'Apellido': author.lastName,
      'Fecha de Nacimiento': author.birthDate?.toISOString().split('T')[0] || '',
      'Biografía': author.biography || '',
      'Nacionalidad': author.nationality || '',
      'Fecha de Creación': author.createdAt?.toISOString().split('T')[0] || '',
      'Fecha de Actualización': author.updatedAt?.toISOString().split('T')[0] || '',
    }));
  }

  formatPublishersForExport(publishers: any[]): any[] {
    return publishers.map(publisher => ({
      'Nombre': publisher.name,
      'País': publisher.country || '',
      'Año de Fundación': publisher.foundationYear || '',
      'Descripción': publisher.description || '',
      'Sitio Web': publisher.website || '',
      'Fecha de Creación': publisher.createdAt?.toISOString().split('T')[0] || '',
      'Fecha de Actualización': publisher.updatedAt?.toISOString().split('T')[0] || '',
    }));
  }

  formatGenresForExport(genres: any[]): any[] {
    return genres.map(genre => ({
      'Nombre': genre.name,
      'Descripción': genre.description || '',
      'Fecha de Creación': genre.createdAt?.toISOString().split('T')[0] || '',
      'Fecha de Actualización': genre.updatedAt?.toISOString().split('T')[0] || '',
    }));
  }
}