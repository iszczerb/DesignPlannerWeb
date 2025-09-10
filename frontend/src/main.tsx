import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

console.log('🎯 main.tsx: Starting React app...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

console.log('🎯 main.tsx: React app rendered');