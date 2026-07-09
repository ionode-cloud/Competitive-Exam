import './App.css';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ExamProvider } from './context/ExamContext'
import { UserProvider } from './context/UserContext'
import { CourseProvider } from './context/CourseContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProvider>
        <CourseProvider>
          <ExamProvider>
            <App />
          </ExamProvider>
        </CourseProvider>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>,
)
