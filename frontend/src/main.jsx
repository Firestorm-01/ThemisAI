import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Ingest from './pages/Ingest'
import GraphPage from './pages/GraphPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/ingest" element={<Ingest />} />
          <Route path="/graph" element={<GraphPage />} />
        </Routes>
      </App>
    </BrowserRouter>
  </React.StrictMode>
)
