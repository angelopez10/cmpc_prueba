import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import Login from './pages/Login';
import Register from './pages/Register';
import { Layout } from './components/Layout';
import { Books } from './pages/Books';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import AuthorsList from './pages/AuthorsList';
import GenresList from './pages/GenresList';
import PublishersList from './pages/PublishersList';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  React.useEffect(() => {
    // La inicialización ahora se maneja en main.tsx
    checkAuth();
  }, [checkAuth]);

  // Mostrar loading mientras se verifica la autenticación inicial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" message="Inicializando aplicación..." />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      
        
        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/books" />} />
          <Route path="books" element={<Books />} />
          <Route path="authors" element={<AuthorsList />} />
          <Route path='genres' element={<GenresList />} />
          <Route path='publishers' element={<PublishersList />} />
        </Route>
        
        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
