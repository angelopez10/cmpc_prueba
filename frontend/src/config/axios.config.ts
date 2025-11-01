import axios, { AxiosInstance } from 'axios';


// Crear instancia de axios con configuración base
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Importante para cookies y CSRF
});

// NOTA: Los interceptores ya están configurados en el authInterceptor
// No necesitamos aplicarlos manualmente aquí

// Configurar headers de seguridad adicionales
apiClient.interceptors.request.use(
  (config) => {
    // Añadir headers de seguridad
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['X-Frame-Options'] = 'DENY';
    config.headers['X-Content-Type-Options'] = 'nosniff';
    config.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';


    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Manejo de errores globales
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo de errores específicos
    if (error.response?.status === 401) {
      console.error('No autorizado - redirigiendo al login');
    } else if (error.response?.status === 403) {
      console.error('Prohibido - sin permisos suficientes');
    } else if (error.response?.status === 419) {
      console.error('Token CSRF inválido o expirado');
    }

    return Promise.reject(error);
  }
);

export default apiClient;