import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAuthLoading, useIsAuthenticated } from '../stores/auth.store';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  fallbackUrl?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackUrl = '/login'
}) => {
  const location = useLocation();
  const { checkAuth } = useAuthStore();
  const isLoading = useAuthLoading();
  const isAuthenticated = useIsAuthenticated();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Verificar autenticación
        await checkAuth();
        
        // Verificar permisos adicionales si se requieren
        if (requiredRole || requiredPermission) {
          const hasRequiredPermission = await checkPermissions();
          setHasPermission(hasRequiredPermission);
        }
      } catch (error) {
        console.error('Error al validar acceso:', error);
        setHasPermission(false);
      } finally {
        setIsChecking(false);
      }
    };

    validateAccess();
  }, [checkAuth, requiredRole, requiredPermission]);

  const checkPermissions = async (): Promise<boolean> => {
    try {
      // Obtener usuario actual del store
      const user = useAuthStore.getState().user;
      
      if (!user) return false;

      // Verificar rol si se requiere
      if (requiredRole && user.role !== requiredRole) {
        return false;
      }

      // Verificar permiso específico si se requiere
      if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" message="Verificando autenticación..." />
      </div>
    );
  }

  // Si no está autenticado, redirigir al login con la URL actual como returnUrl
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={`${fallbackUrl}?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} 
        replace 
      />
    );
  }

  // Si está autenticado pero no tiene los permisos requeridos
  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes los permisos necesarios para acceder a esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si todo está bien, renderizar los children
  return <>{children}</>;
};

export default ProtectedRoute;