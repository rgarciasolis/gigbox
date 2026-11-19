import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RepositoriesProvider, createRepositories } from '@/data'
import { App } from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

const repositories = createRepositories()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider repositories={repositories}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RepositoriesProvider>
    </QueryClientProvider>
  </StrictMode>,
)
