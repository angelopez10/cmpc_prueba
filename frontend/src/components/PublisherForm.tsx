import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Publisher } from '../types';
import { publishersService } from '../services/publishers.service';

const publisherSchema = yup.object({
  name: yup.string().required('El nombre es requerido'),
  country: yup.string().optional(),
  foundationYear: yup
    .number()
    .integer('Debe ser un año válido')
    .min(1000, 'El año debe ser válido')
    .max(new Date().getFullYear(), 'El año no puede ser futuro')
    .optional(),
  description: yup.string().optional(),
  website: yup.string().url('Debe ser una URL válida').optional(),
});

type PublisherFormData = yup.InferType<typeof publisherSchema>;

interface PublisherFormProps {
  publisher?: Publisher;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PublisherForm({ publisher, onSuccess, onClose }: PublisherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublisherFormData>({
    resolver: yupResolver(publisherSchema),
    defaultValues: publisher
      ? {
          name: publisher.name,
          country: publisher.country || '',
          foundationYear: publisher.foundationYear || undefined,
          description: publisher.description || '',
          website: publisher.website || '',
        }
      : {},
  });

  const onSubmit = async (data: PublisherFormData) => {
    try {
      setIsSubmitting(true);
      
      const publisherData = {
        ...data,
        country: data.country || undefined,
        foundationYear: data.foundationYear || undefined,
        description: data.description || undefined,
        website: data.website || undefined,
      };

      if (publisher) {
        await publishersService.updatePublisher(publisher.id, publisherData);
        toast.success('Editorial actualizada exitosamente');
      } else {
        await publishersService.createPublisher(publisherData);
        toast.success('Editorial creada exitosamente');
      }

      onSuccess();
    } catch (error) {
      toast.error('Error al guardar la editorial');
      console.error('Error saving publisher:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {publisher ? 'Editar Editorial' : 'Nueva Editorial'}
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
              País
            </label>
            <input
              type="text"
              {...register('country')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año de Fundación
            </label>
            <input
              type="number"
              {...register('foundationYear')}
              min="1000"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.foundationYear && (
              <p className="text-red-500 text-sm mt-1">{errors.foundationYear.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sitio Web
            </label>
            <input
              type="url"
              {...register('website')}
              placeholder="https://ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.website && (
              <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
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