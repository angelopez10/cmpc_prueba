export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface TokenPayload {
  exp: number;
  iat: number;
  userId: string;
  role: string;
  email: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  isbn?: string;
  publicationYear?: number;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isAvailable: boolean;
  authorId: string;
  publisherId: string;
  genreId: string;
  author?: Author;
  publisher?: Publisher;
  genre?: Genre;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  name: string;
  lastName?: string;
  birthDate?: Date;
  biography?: string;
  nationality?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Publisher {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  country?: string;
  foundationYear?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Genre {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookFilterDto {
  search?: string;
  authorId?: string;
  publisherId?: string;
  genreIds?: string[];
  genreId?: string;
  minPrice?: number;
  maxPrice?: number;
  minPublicationYear?: number;
  maxPublicationYear?: number;
  availableOnly?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
  path: string;
}