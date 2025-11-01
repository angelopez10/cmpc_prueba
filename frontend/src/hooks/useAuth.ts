import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  useAuthStore, 
  useUser, 
  useIsAuthenticated, 
  useAuthLoading, 
  useAuthError 
} from '../stores/auth.store';
import { LoginCredentials, RegisterData } from '../types';

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener estado y acciones del store
  const { 
    login: loginAction, 
    register: registerAction, 
    logout: logoutAction, 
    clearError,
    checkAuth 
  } = useAuthStore();
  
  // Obtener selectores individuales para mejor rendimiento
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  // Login con redirección automática
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await loginAction(credentials.email, credentials.password);
      
      // Obtener URL de retorno desde los parámetros o redirigir a libros
      const params = new URLSearchParams(location.search);
      const returnUrl = params.get('returnUrl') || '/books';
      
      navigate(returnUrl, { replace: true });
    } catch (error) {
      // El error ya está manejado en el store
      console.error('Error en login:', error);
      throw error;
    }
  }, [loginAction, navigate, location.search]);

  // Register con redirección automática
  const register = useCallback(async (data: RegisterData) => {
    try {
      // Combinar firstName y lastName para el store
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      await registerAction(fullName, data.email, data.password, data.confirmPassword || '');
      
      // Redirigir a books después de registro exitoso
      navigate('/books', { replace: true });
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }, [registerAction, navigate]);

  // Logout con redirección
  const logout = useCallback(async () => {
    try {
      await logoutAction();
      
      // Limpiar cualquier error y redirigir al login
      clearError();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así redirigir al login
      navigate('/login', { replace: true });
    }
  }, [logoutAction, clearError, navigate]);

  // Verificar autenticación periódicamente
  useEffect(() => {
    // Verificar inmediatamente al montar
    checkAuth();

    // Configurar verificación periódica
    const interval = setInterval(() => {
      if (isAuthenticated) {
        checkAuth();
      }
    }, 5 * 60 * 1000); // Verificar cada 5 minutos

    return () => clearInterval(interval);
  }, [checkAuth, isAuthenticated]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [error, clearError]);

  // Verificar si el usuario tiene un rol específico
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  // Verificar si el usuario tiene al menos uno de los roles
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user]);

  // Verificar si el usuario tiene todos los permisos
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.every(permission => user.permissions!.includes(permission));
  }, [user]);

  return {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Acciones
    login,
    register,
    logout,
    checkAuth,
    clearError,
    
    // Utilidades de permisos
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllPermissions
  };
};

export default useAuth;