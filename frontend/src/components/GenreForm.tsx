import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Genre } from '../types';
import { genresService } from '../services/genres.service';

const genreSchema = yup.object({
  name: yup.string().required('El nombre es requerido'),
  description: yup.string().optional(),
});

type GenreFormData = yup.InferType<typeof genreSchema>;

interface GenreFormProps {
  genre?: Genre;
  onSuccess: () => void;
  onClose: () => void;
}

export default function GenreForm({ genre, onSuccess, onClose }: GenreFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenreFormData>({
    resolver: yupResolver(genreSchema),
    defaultValues: genre
      ? {
          name: genre.name,
          description: genre.description || '',
        }
      : {},
  });

  const onSubmit = async (data: GenreFormData) => {
    try {
      setIsSubmitting(true);
      
      const genreData = {
        ...data,
        description: data.description || undefined,
      };

      if (genre) {
        await genresService.updateGenre(genre.id, genreData);
        toast.success('Género actualizado exitosamente');
      } else {
        await genresService.createGenre(genreData);
        toast.success('Género creado exitosamente');
      }

      onSuccess();
    } catch (error) {
      toast.error('Error al guardar el género');
      console.error('Error saving genre:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {genre ? 'Editar Género' : 'Nuevo Género'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}