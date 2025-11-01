import axios, { AxiosInstance } from 'axios';
import { Genre, PaginatedResponse } from '../types';

class GenresService {
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

  async getGenres(search?: string): Promise<PaginatedResponse<Genre>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await this.api.get<PaginatedResponse<Genre>>(`/genres?${params}`);
    return response.data;
  }

  async getGenre(id: string): Promise<Genre> {
    const response = await this.api.get<Genre>(`/genres/${id}`);
    return response.data;
  }

  async createGenre(genreData: {
    name: string;
    description?: string;
  }): Promise<Genre> {
    const response = await this.api.post<Genre>('/genres', genreData);
    return response.data;
  }

  async updateGenre(id: string, genreData: Partial<{
    name: string;
    description?: string;
  }>): Promise<Genre> {
    const response = await this.api.patch<Genre>(`/genres/${id}`, genreData);
    return response.data;
  }

  async deleteGenre(id: string): Promise<void> {
    await this.api.delete(`/genres/${id}`);
  }
}

export const genresService = new GenresService();