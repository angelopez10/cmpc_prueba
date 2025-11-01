import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/auth.store'

const queryClient = new QueryClient()

// Componente de inicialización de autenticación simplificado
const AuthInitializer: React.FC = () => {
  const { initializeAuth } = useAuthStore()
  
  React.useEffect(() => {
    const initialize = async () => {
      try {
        // Inicializar estado de autenticación desde localStorage
        await initializeAuth()
        console.log('Autenticación inicializada')
      } catch (error) {
        console.error('Error al inicializar autenticación:', error)
      }
    }
    
    initialize()
  }, [initializeAuth])
  
  return null
}

// Renderizar aplicación con inicialización de autenticación
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
