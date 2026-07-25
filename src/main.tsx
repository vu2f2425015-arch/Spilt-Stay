import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { App } from './App'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
const isClerkConfigured = Boolean(
  PUBLISHABLE_KEY && 
  !PUBLISHABLE_KEY.includes('placeholder') && 
  PUBLISHABLE_KEY.startsWith('pk_')
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isClerkConfigured ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
