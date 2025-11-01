import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Author } from '../types';
import { authorsService } from '../services/authors.service';

const authorSchema = yup.object({
  name: yup.string().required('El nombre es requerido'),
  lastName: yup.string().required('El apellido es requerido'),
  birthDate: yup.string().optional(),
  biography: yup.string().optional(),
  nationality: yup.string().optional(),
});

type AuthorFormData = yup.InferType<typeof authorSchema>;

interface AuthorFormProps {
  author?: Author;
  onSuccess: () => void;
  onClose: () => void;
}

export default function AuthorForm({ author, onSuccess, onClose }: AuthorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthorFormData>({
    resolver: yupResolver(authorSchema),
    defaultValues: author
      ? {
          name: author.name,
          lastName: author.lastName,
          birthDate: author.birthDate ? new Date(author.birthDate).toISOString().split('T')[0] : '',
          biography: author.biography || '',
          nationality: author.nationality || '',
        }
      : {},
  });

  const onSubmit = async (data: AuthorFormData) => {
    try {
      setIsSubmitting(true);
      
      const authorData = {
        ...data,
        birthDate: data.birthDate || undefined,
        biography: data.biography || undefined,
        nationality: data.nationality || undefined,
      };

      if (author) {
        await authorsService.updateAuthor(author.id, authorData);
        toast.success('Autor actualizado exitosamente');
      } else {
        await authorsService.createAuthor(authorData);
        toast.success('Autor creado exitosamente');
      }

      onSuccess();
    } catch (error) {
      toast.error('Error al guardar el autor');
      console.error('Error saving author:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {author ? 'Editar Autor' : 'Nuevo Autor'}
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
              Apellido *
            </label>
            <input
              type="text"
              {...register('lastName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              {...register('birthDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nacionalidad
            </label>
            <input
              type="text"
              {...register('nationality')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biografía
            </label>
            <textarea
              {...register('biography')}
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