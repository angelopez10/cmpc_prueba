import { ExportService } from '../../src/common/services/export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  describe('exportToCSV', () => {
    it('should export data with headers to CSV buffer', async () => {
      const headers = ['Nombre', 'País'];
      const data = [
        { 'Nombre': 'Editorial A', 'País': 'CL' },
        { 'Nombre': 'Editorial B', 'País': 'AR' },
      ];

      const buffer = await service.exportToCSV(data, headers);
      const csv = buffer.toString('utf-8');

      expect(csv).toContain('Nombre,País');
      expect(csv).toContain('Editorial A,CL');
      expect(csv).toContain('Editorial B,AR');
    });

    it('should reject when csv stream emits error', async () => {
      const fastCsv = require('fast-csv');
      const { EventEmitter } = require('events');
      class MockCsvStream extends EventEmitter {
        pipe() { return this; }
        write() {}
        end() { this.emit('error', new Error('CSV error')); }
      }
      const spy = jest.spyOn(fastCsv, 'format').mockImplementation(() => new MockCsvStream());

      await expect(service.exportToCSV([{ a: 1 }], ['a'])).rejects.toThrow('CSV error');

      spy.mockRestore();
    });
  });

  describe('formatBooksForExport', () => {
    it('should format books with defaults and computed fields', () => {
      const books = [{
        title: 'Book 1',
        price: 10,
        stockQuantity: 5,
        isAvailable: true,
        author: { firstName: 'John', lastName: 'Doe' },
        publisher: { name: 'Pub' },
        genre: { name: 'Genre' },
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-02'),
      }];

      const rows = service.formatBooksForExport(books);
      expect(rows[0]['Título']).toBe('Book 1');
      expect(rows[0]['Disponible']).toBe('Sí');
      expect(rows[0]['Autor']).toBe('John Doe');
      expect(rows[0]['Editorial']).toBe('Pub');
      expect(rows[0]['Género']).toBe('Genre');
      expect(rows[0]['Fecha de Creación']).toBe('2020-01-01');
      expect(rows[0]['Fecha de Actualización']).toBe('2020-01-02');
    });

    it('should mark as "No" when book is not available', () => {
      const books = [{
        title: 'Book 2',
        price: 15,
        stockQuantity: 0,
        isAvailable: false,
        author: { firstName: 'Jane', lastName: 'Smith' },
        publisher: { name: 'Pub 2' },
        genre: { name: 'Genre 2' },
        createdAt: new Date('2020-02-01'),
        updatedAt: new Date('2020-02-02'),
      }];

      const rows = service.formatBooksForExport(books);
      expect(rows[0]['Título']).toBe('Book 2');
      expect(rows[0]['Disponible']).toBe('No');
      expect(rows[0]['Autor']).toBe('Jane Smith');
      expect(rows[0]['Editorial']).toBe('Pub 2');
      expect(rows[0]['Género']).toBe('Genre 2');
      expect(rows[0]['Fecha de Creación']).toBe('2020-02-01');
      expect(rows[0]['Fecha de Actualización']).toBe('2020-02-02');
    });
  });

  describe('formatAuthorsForExport', () => {
    it('should format authors with defaults', () => {
      const authors = [{
        firstName: 'John',
        lastName: 'Doe',
        birthDate: new Date('1990-05-10'),
        biography: '',
        nationality: 'CL',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-02'),
      }];

      const rows = service.formatAuthorsForExport(authors);
      expect(rows[0]['Nombre']).toBe('John');
      expect(rows[0]['Apellido']).toBe('Doe');
      expect(rows[0]['Fecha de Nacimiento']).toBe('1990-05-10');
      expect(rows[0]['Nacionalidad']).toBe('CL');
      expect(rows[0]['Fecha de Creación']).toBe('2020-01-01');
      expect(rows[0]['Fecha de Actualización']).toBe('2020-01-02');
    });
  });

  describe('formatPublishersForExport', () => {
    it('should format publishers with defaults', () => {
      const publishers = [{
        name: 'Editorial',
        country: 'CL',
        foundationYear: 2000,
        description: 'Desc',
        website: 'http://x',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-02'),
      }];

      const rows = service.formatPublishersForExport(publishers);
      expect(rows[0]['Nombre']).toBe('Editorial');
      expect(rows[0]['País']).toBe('CL');
      expect(rows[0]['Año de Fundación']).toBe(2000);
      expect(rows[0]['Descripción']).toBe('Desc');
      expect(rows[0]['Sitio Web']).toBe('http://x');
      expect(rows[0]['Fecha de Creación']).toBe('2020-01-01');
      expect(rows[0]['Fecha de Actualización']).toBe('2020-01-02');
    });
  });

  describe('formatGenresForExport', () => {
    it('should format genres with defaults', () => {
      const genres = [{
        name: 'Fiction',
        description: 'Desc',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-02'),
      }];

      const rows = service.formatGenresForExport(genres);
      expect(rows[0]['Nombre']).toBe('Fiction');
      expect(rows[0]['Descripción']).toBe('Desc');
      expect(rows[0]['Fecha de Creación']).toBe('2020-01-01');
      expect(rows[0]['Fecha de Actualización']).toBe('2020-01-02');
    });
  });
});