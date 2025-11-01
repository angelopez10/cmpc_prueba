import axios, { AxiosInstance } from 'axios';
import { Book, BookFilterDto } from '../types';

class BookService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3001/api/books',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getBooks(filters?: BookFilterDto & { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc' }) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await this.api.get(`?${params.toString()}`);
    return response.data.data;
  }

  async getBook(id: string): Promise<Book> {
    const response = await this.api.get(`/${id}`);
    return response.data.data;
  }

  async createBook(data: any): Promise<Book> {
    const response = await this.api.post('', data, {});
    return response.data;
  }

  async updateBook(id: string, data: any): Promise<Book> {
    const response = await this.api.patch(`/${id}`, data, {});
    return response.data;
  }

  async deleteBook(id: string): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  async exportToCsv(filters?: BookFilterDto): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await this.api.get(`/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const bookService = new BookService();