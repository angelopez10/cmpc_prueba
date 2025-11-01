import axios from 'axios';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export class AuthService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post('/auth/login', credentials);

      const payload = response.data?.data ?? response.data;
      const accessToken = payload?.accessToken;
      const user = payload?.user;

      if (!accessToken || !user) {
        throw new Error('Respuesta de autenticación inválida');
      }

      console.log('Login exitoso:', user);

      // Almacenar de forma simple en localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      return {
        user,
        accessToken
      };
    } catch (error: any) {
      console.error('Error en login:', error);

      if (error.response?.status === 401) {
        throw new Error('Credenciales inválidas');
      } else {
        throw new Error('Error al iniciar sesión. Por favor, inténtelo de nuevo.');
      }
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Enviar solo los campos requeridos por el backend
      const { email, password, firstName, lastName } = data;
      const response = await this.axiosInstance.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });

      const payload = response.data?.data ?? response.data;
      const accessToken = payload?.accessToken;
      const user = payload?.user;

      if (!accessToken || !user) {
        throw new Error('Respuesta de registro inválida');
      }

      // Almacenar de forma simple en localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      return {
        user,
        accessToken
      };
    } catch (error: any) {
      console.error('Error en registro:', error);

      if (error.response?.status === 409) {
        throw new Error('El correo electrónico ya está registrado');
      } else if (error.response?.status === 400) {
        throw new Error('Datos de registro inválidos');
      } else {
        throw new Error('Error al registrar usuario. Por favor, inténtelo de nuevo.');
      }
    }
  }

  async logout(): Promise<void> {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (accessToken) {
        // Intentar logout en el servidor
        await this.axiosInstance.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Error en logout del servidor:', error);
      // Continuar con el logout local aunque falle el servidor
    } finally {
      // Siempre limpiar el estado local
      this.clearLocalAuthState();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }

      // Si no hay usuario en almacenamiento, intentar obtener del servidor
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return null;
      }

      const response = await this.axiosInstance.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const user = response.data;

      // Almacenar usuario para futuras referencias
      localStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const accessToken = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    return !!(accessToken && user);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private clearLocalAuthState(): void {
    // Limpiar todos los datos de autenticación
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();