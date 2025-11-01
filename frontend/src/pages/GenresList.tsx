import { useState, useEffect } from 'react';
import { Search, Plus} from 'lucide-react';
import { toast } from 'sonner';
import { Genre } from '../types';
import { genresService } from '../services/genres.service';
import GenreForm from '../components/GenreForm';

export default function GenresList() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | undefined>();


  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async (search?: string) => {
    try {
      setLoading(true);
      const response = await genresService.getGenres(search);
      setGenres(response.data);
    } catch (error) {
      toast.error('Error al cargar géneros');
      console.error('Error fetching genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGenres(searchTerm);
  };



  
  const handleCreate = () => {
    setEditingGenre(undefined);
    setShowForm(true);
  };



  const handleFormClose = () => {
    setShowForm(false);
    setEditingGenre(undefined);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingGenre(undefined);
    fetchGenres();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Géneros</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Género
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar géneros..."
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
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {genres.map((genre) => (
                  <tr key={genre.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {genre.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {genre.description || 'Sin descripción'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          genre.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {genre.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {genres.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron géneros
            </div>
          )}
        </div>
      )}

      {showForm && (
        <GenreForm
          genre={editingGenre}
          onSuccess={handleFormSuccess}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}