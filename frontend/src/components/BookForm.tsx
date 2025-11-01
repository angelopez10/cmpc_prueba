import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress
} from '@mui/material';

import { Book, Author, Publisher, Genre } from '../types';

const bookSchema = yup.object({
  title: yup.string().required('El título es requerido'),
  description: yup.string().nullable(),
  isbn: yup.string().nullable(),
  publicationYear: yup
    .number()
    .positive('El año debe ser positivo')
    .integer('Debe ser un número entero')
    .min(1000)
    .max(new Date().getFullYear())
    .nullable(),
  price: yup
    .number()
    .positive('El precio debe ser positivo')
    .required('El precio es requerido'),
  stockQuantity: yup
    .number()
    .integer('Debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .default(0),
  authorId: yup.string().required('El autor es requerido'),
  publisherId: yup.string().required('La editorial es requerida'),
  genreId: yup.string().required('El género es requerido'),
  isAvailable: yup.boolean().default(true)
});

type BookFormData = yup.InferType<typeof bookSchema>;

interface BookFormProps {
  book?: Book | null;
  authors: Author[];
  publishers: Publisher[];
  genres: Genre[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const BookForm: React.FC<BookFormProps> = ({
  book,
  authors,
  publishers,
  genres,
  onSubmit,
  onCancel,
  isLoading = false
}) => {

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<BookFormData>({
    resolver: yupResolver(bookSchema),
    defaultValues: {
      title: book?.title || '',
      isbn: book?.isbn || '',
      authorId: book?.authorId || book?.author?.id || '',
      publisherId: book?.publisherId || book?.publisher?.id || '',
      genreId: book?.genreId || book?.genre?.id || '',
      publicationYear: book?.publicationYear ?? undefined,
      description: book?.description || '',
      price: book?.price ?? undefined,
      stockQuantity: book?.stockQuantity ?? 0,
      isAvailable: book?.isAvailable ?? true
    }
  });

 

  

  const onFormSubmit = (data: any) => {
   
    onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        

        {/* Título */}
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Título"
              error={!!errors.title}
              helperText={errors.title?.message}
              fullWidth
            />
          )}
        />

        {/* ISBN */}
        <Controller
          name="isbn"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="ISBN"
              error={!!errors.isbn}
              helperText={errors.isbn?.message}
              fullWidth
            />
          )}
        />

        {/* Autor */}
        <Controller
          name="authorId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.authorId}>
              <InputLabel>Autor</InputLabel>
              <Select {...field} label="Autor">
                {authors.map((author) => (
                  <MenuItem key={author.id} value={author.id}>
                    {author.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.authorId && (
                <Typography variant="caption" color="error">
                  {errors.authorId.message}
                </Typography>
              )}
            </FormControl>
          )}
        />

        {/* Editorial */}
        <Controller
          name="publisherId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.publisherId}>
              <InputLabel>Editorial</InputLabel>
              <Select {...field} label="Editorial">
                {publishers.map((publisher) => (
                  <MenuItem key={publisher.id} value={publisher.id}>
                    {publisher.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.publisherId && (
                <Typography variant="caption" color="error">
                  {errors.publisherId.message}
                </Typography>
              )}
            </FormControl>
          )}
        />

        {/* Género */}
        <Controller
          name="genreId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.genreId}>
              <InputLabel>Género</InputLabel>
              <Select {...field} label="Género">
                {genres.map((genre) => (
                  <MenuItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.genreId && (
                <Typography variant="caption" color="error">
                  {errors.genreId.message}
                </Typography>
              )}
            </FormControl>
          )}
        />

        {/* Año de publicación */}
        <Controller
          name="publicationYear"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Año de publicación"
              type="number"
              error={!!errors.publicationYear}
              helperText={errors.publicationYear?.message}
              fullWidth
            />
          )}
        />

        {/* Precio */}
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Precio"
              type="number"
              inputProps={{ step: 0.01 }}
              error={!!errors.price}
              helperText={errors.price?.message}
              fullWidth
            />
          )}
        />

        {/* Stock */}
        <Controller
          name="stockQuantity"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Stock"
              type="number"
              error={!!errors.stockQuantity}
              helperText={errors.stockQuantity?.message}
              fullWidth
            />
          )}
        />

        {/* Descripción */}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Descripción"
              multiline
              rows={4}
              fullWidth
            />
          )}
        />
      </Box>

      {/* Botones de acción */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={isLoading} startIcon={isLoading ? <CircularProgress size={20} /> : null}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </Box>
    </Box>
  );
};