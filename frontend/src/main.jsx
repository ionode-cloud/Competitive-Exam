import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ExamProvider } from './context/ExamContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ExamProvider>
        <App />
      </ExamProvider>
    </AuthProvider>
  </React.StrictMode>,
)
