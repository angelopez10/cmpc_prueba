import axios, { AxiosInstance } from 'axios';
import { Author, PaginatedResponse } from '../types';

class AuthorsService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token a las peticiones
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAuthors(search?: string): Promise<PaginatedResponse<Author>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await this.api.get<PaginatedResponse<Author>>(`/authors?${params}`);
    return response.data;
  }

  async getAuthor(id: string): Promise<Author> {
    const response = await this.api.get<Author>(`/authors/${id}`);
    return response.data;
  }

  async createAuthor(authorData: {
    name: string;
    lastName: string;
    birthDate?: string;
    biography?: string;
    nationality?: string;
  }): Promise<Author> {
    const response = await this.api.post<Author>('/authors', authorData);
    return response.data;
  }

  async updateAuthor(id: string, authorData: Partial<{
    name: string;
    lastName: string;
    birthDate?: string;
    biography?: string;
    nationality?: string;
  }>): Promise<Author> {
    const response = await this.api.patch<Author>(`/authors/${id}`, authorData);
    return response.data;
  }

  async deleteAuthor(id: string): Promise<void> {
    await this.api.delete(`/authors/${id}`);
  }
}

export const authorsService = new AuthorsService();