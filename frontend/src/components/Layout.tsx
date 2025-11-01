import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, LogOut, User, Building2, Tag, PenTool } from 'lucide-react';
import { Toaster } from 'sonner';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                CMPC Libros
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-5 px-2">
            <Link
              to="/books"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-100"
            >
              <BookOpen className="mr-3 h-5 w-5 text-gray-500" />
              Libros
            </Link>
            
            <Link
              to="/authors"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-100"
            >
              <PenTool className="mr-3 h-5 w-5 text-gray-500" />
              Autores
            </Link>
            
            <Link
              to="/publishers"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-100"
            >
              <Building2 className="mr-3 h-5 w-5 text-gray-500" />
              Editoriales
            </Link>
            
            <Link
              to="/genres"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-100"
            >
              <Tag className="mr-3 h-5 w-5 text-gray-500" />
              Géneros
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};