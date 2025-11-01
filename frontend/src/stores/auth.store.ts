import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.login({ email, password });
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error al iniciar sesión'
      });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, confirmPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Dividir el nombre en firstName y lastName
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const response = await authService.register({
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      });
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error al registrar usuario'
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  checkAuth: async () => {
    const { isAuthenticated } = get();
    
    if (!isAuthenticated) return;
    
    try {
      // Solo verificar si hay token y usuario en localStorage
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        // No hay usuario, hacer logout
        await get().logout();
      } else {
        // Actualizar información del usuario si es necesario
        if (JSON.stringify(currentUser) !== JSON.stringify(get().user)) {
          set({ user: currentUser });
        }
      }
    } catch (error) {
      console.error('Error al validar sesión:', error);
      await get().logout();
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    
    try {
      // Verificar si hay datos en localStorage
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (userData && token) {
        const user = JSON.parse(userData);
        set({
          user,
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Error al inicializar autenticación:', error);
      // Si hay error, limpiar estado
      set({
        user: null,
        isAuthenticated: false
      });
    } finally {
      set({ isLoading: false });
    }
  }
}));

// Selector hooks para mejor rendimiento
export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);