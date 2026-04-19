import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ToastContainer from './components/ToastContainer'
import { ToastProvider } from './hooks/useToast'

export default function App({ children }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <ToastProvider>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <main style={{ paddingTop: isHome ? 0 : '72px' }}>
          {children}
        </main>
        <ToastContainer />
      </div>
    </ToastProvider>
  )
}
