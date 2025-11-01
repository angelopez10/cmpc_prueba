import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridFilterModel, GridSortModel } from '@mui/x-data-grid';
import { Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, CircularProgress, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { Edit, Delete, Add, Search, Visibility, Download } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookService } from '../services/book.service';
import { authorsService } from '../services/authors.service';
import { publishersService } from '../services/publishers.service';
import { genresService } from '../services/genres.service';
import { BookForm } from '../components/BookForm';
import { Book } from '../types';


interface BookFilters {
  title: string;
  authorId: string;
  genreId: string;
  publisherId: string;
  isbn: string;
  isAvailable: boolean | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export const Books: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<BookFilters>({
    title: '',
    authorId: '',
    genreId: '',
    publisherId: '',
    isbn: '',
    isAvailable: null,
    minPrice: null,
    maxPrice: null
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch books with server-side pagination, sorting and filtering
  const { data: booksData, isLoading, error } = useQuery({
    queryKey: ['books', page, pageSize, search, sortModel, filterModel, filters],
    queryFn: () => {
      const sortField = sortModel[0]?.field;
      const allowedSortFields = ['title', 'price', 'publicationYear', 'createdAt'];
      const sortBy = allowedSortFields.includes(String(sortField)) ? String(sortField) : undefined;
      const sortOrder = sortModel[0]?.sort ? (sortModel[0]?.sort === 'asc' ? 'ASC' : 'DESC') : undefined;

      return bookService.getBooks({
        page: page + 1,
        limit: pageSize,
        search,
        sortBy,
        sortOrder,
        authorId: filters.authorId || undefined,
        publisherId: filters.publisherId || undefined,
        genreId: filters.genreId || undefined,
        minPrice: filters.minPrice ?? undefined,
        maxPrice: filters.maxPrice ?? undefined,
        availableOnly: filters.isAvailable ?? undefined
      });
    }
  });

  // Fetch related data for filters
  const { data: authors } = useQuery({
    queryKey: ['authors'],
    queryFn: () => authorsService.getAuthors()
  });

  const { data: publishers } = useQuery({
    queryKey: ['publishers'],
    queryFn: () => publishersService.getPublishers()
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresService.getGenres()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => bookService.createBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setOpenDialog(false);
      setSelectedBook(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => bookService.updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setOpenDialog(false);
      setSelectedBook(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookService.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setOpenDeleteDialog(false);
      setBookToDelete(null);
    }
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Título', flex: 1, minWidth: 200 },
    { field: 'isbn', headerName: 'ISBN', width: 130 },
    { field: 'authorName', headerName: 'Autor', width: 150},
    { field: 'publisherName', headerName: 'Editorial', width: 150},
    { field: 'genreName', headerName: 'Género', width: 150},
    { field: 'publicationYear', headerName: 'Año', width: 100, type: 'number' },
    { field: 'price', headerName: 'Precio', width: 100, type: 'number' },
    { field: 'stockQuantity', headerName: 'Stock', width: 100, type: 'number' },
    { field: 'isAvailable', headerName: 'Disponible', width: 120, type: 'boolean' },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleView(params.row)}
          >
            <Visibility />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Box>
      )
    }
  ];

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setOpenDialog(true);
  };

  const handleDelete = (book: Book) => {
    setBookToDelete(book);
    setOpenDeleteDialog(true);
  };

  const handleCreate = () => {
    setSelectedBook(null);
    setOpenDialog(true);
  };

  const handleExportCsv = async () => {
    try {
      
      const exportFilters = {
        search: search || undefined,
        authorId: filters.authorId || undefined,
        publisherId: filters.publisherId || undefined,
        genreId: filters.genreId || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        availableOnly: filters.isAvailable || undefined,
      };

    
      const csvBlob = await bookService.exportToCsv(exportFilters);
      
     
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      
  
      const currentDate = new Date();
      const dateStr = currentDate.toISOString().split('T')[0].replace(/-/g, '');
      link.download = `libros_${dateStr}.csv`;
      
     
      document.body.appendChild(link);
      link.click();
      
     
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error al exportar los datos. Por favor, intente nuevamente.');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBook(null);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setBookToDelete(null);
  };

  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  const handleView = (book: Book) => {
    setDetailBook(book);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setDetailBook(null);
  };

  const handleSubmit = async (data: any) => {
    if (selectedBook) {
      
      await updateMutation.mutateAsync({ id: selectedBook.id, data });
    } else {
      console.log(data, "aaaaaaa")
      await createMutation.mutateAsync(data);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [filters, sortModel]);

  if (error) {
    return <div>Error al cargar libros</div>;
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar libros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1 }} />
            }}
            size="small"
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Autor</InputLabel>
            <Select
              label="Autor"
              value={filters.authorId}
              onChange={(e) => setFilters((f) => ({ ...f, authorId: e.target.value }))}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {(authors?.data || []).map((a: any) => (
                <MenuItem key={a.id} value={a.id}>{a.name} {a.lastName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Editorial</InputLabel>
            <Select
              label="Editorial"
              value={filters.publisherId}
              onChange={(e) => setFilters((f) => ({ ...f, publisherId: e.target.value }))}
            >
              <MenuItem value=""><em>Todas</em></MenuItem>
              {(publishers?.data || []).map((p: any) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Género</InputLabel>
            <Select
              label="Género"
              value={filters.genreId}
              onChange={(e) => setFilters((f) => ({ ...f, genreId: e.target.value }))}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {(genres?.data || []).map((g: any) => (
                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Precio mín"
            type="number"
            value={filters.minPrice ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value === '' ? null : Number(e.target.value) }))}
            size="small"
            sx={{ width: 120 }}
          />
          <TextField
            label="Precio máx"
            type="number"
            value={filters.maxPrice ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value === '' ? null : Number(e.target.value) }))}
            size="small"
            sx={{ width: 120 }}
          />
          <FormControlLabel
            control={<Checkbox checked={!!filters.isAvailable} onChange={(e) => setFilters((f) => ({ ...f, isAvailable: e.target.checked }))} />}
            label="Solo disponibles"
          />
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCsv}
            disabled={isLoading}
          >
            Exportar a CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Nuevo Libro
          </Button>
        </Box>
      </Box>

      <DataGrid
        rows={booksData?.data || []}
        rowCount={booksData?.total || 0}
        columns={columns}
        loading={isLoading}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationMode="server"
        sortingMode="server"
        filterMode="server"
        disableColumnFilter
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(model) => {
          setPage(model.page);
          setPageSize(model.pageSize);
        }}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          '& .MuiDataGrid-cell': {
            fontSize: '0.875rem'
          }
        }}
      />

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedBook ? 'Editar Libro' : 'Nuevo Libro'}
        </DialogTitle>
        <DialogContent>
          <BookForm
            book={selectedBook}
            authors={authors?.data || []}
            publishers={publishers?.data || []}
            genres={genres?.data || []}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro de que desea eliminar el libro "{bookToDelete?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button
            onClick={() => bookToDelete && deleteMutation.mutate(bookToDelete.id)}
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalle del Libro</DialogTitle>
        <DialogContent>
          {detailBook && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {detailBook?.imageUrl && (
                <img src={detailBook?.imageUrl} alt={detailBook?.title} style={{ width: 140, height: 'auto', borderRadius: 8 }} />
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
                <div><strong>Título:</strong> {detailBook?.title}</div>
                <div><strong>ISBN:</strong> {detailBook?.isbn}</div>
                <div><strong>Autor:</strong> {detailBook?.author?.name} {detailBook?.author?.lastName}</div>
                <div><strong>Editorial:</strong> {detailBook?.publisher?.name}</div>
                <div><strong>Género:</strong> {detailBook?.genre?.name}</div>
                <div><strong>Año:</strong> {detailBook?.publicationYear}</div>
                <div><strong>Precio:</strong> {detailBook?.price}</div>
                <div><strong>Stock:</strong> {detailBook?.stockQuantity}</div>
                <div><strong>Disponible:</strong> {detailBook?.isAvailable ? 'Sí' : 'No'}</div>
                {detailBook?.description && <div><strong>Descripción:</strong> {detailBook?.description}</div>}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      </Box>
  )}
      