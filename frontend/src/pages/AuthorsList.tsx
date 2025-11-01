import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Author } from '../types';
import { authorsService } from '../services/authors.service';
import AuthorForm from '../components/AuthorForm';

export default function AuthorsList() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | undefined>();

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async (search?: string) => {
    try {
      setLoading(true);
      const response = await authorsService.getAuthors(search);
      setAuthors(response.data);
    } catch (error) {
      toast.error('Error al cargar autores');
      console.error('Error fetching authors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuthors(searchTerm);
  };


  const handleCreate = () => {
    setEditingAuthor(undefined);
    setShowForm(true);
  };

  

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAuthor(undefined);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAuthor(undefined);
    fetchAuthors();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Autores</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Autor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar autores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
          >
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apellido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nacionalidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Nacimiento
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {authors.map((author) => (
                  <tr key={author.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {author.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {author.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {author.nationality || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {author.birthDate ? new Date(author.birthDate).toLocaleDateString() : 'N/A'}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {authors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron autores
            </div>
          )}
        </div>
      )}

      {showForm && (
        <AuthorForm
          author={editingAuthor}
          onSuccess={handleFormSuccess}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}