import axios, { AxiosInstance } from 'axios';
import { Publisher, PaginatedResponse } from '../types';

class PublishersService {
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

  async getPublishers(search?: string): Promise<PaginatedResponse<Publisher>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await this.api.get<PaginatedResponse<Publisher>>(`/publishers?${params}`);
    return response.data;
  }

  async getPublisher(id: string): Promise<Publisher> {
    const response = await this.api.get<Publisher>(`/publishers/${id}`);
    return response.data;
  }

  async createPublisher(publisherData: {
    name: string;
    country?: string;
    foundationYear?: number;
    description?: string;
    website?: string;
  }): Promise<Publisher> {
    const response = await this.api.post<Publisher>('/publishers', publisherData);
    return response.data;
  }

  async updatePublisher(id: string, publisherData: Partial<{
    name: string;
    country?: string;
    foundationYear?: number;
    description?: string;
    website?: string;
  }>): Promise<Publisher> {
    const response = await this.api.patch<Publisher>(`/publishers/${id}`, publisherData);
    return response.data;
  }

  async deletePublisher(id: string): Promise<void> {
    await this.api.delete(`/publishers/${id}`);
  }
}

export const publishersService = new PublishersService();