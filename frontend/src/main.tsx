import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add Phantom wallet types
declare global {
  interface Window {
    solana?: {
      isPhantom: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
