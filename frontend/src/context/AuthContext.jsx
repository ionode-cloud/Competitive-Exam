import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('admin')));
  const [student, setStudent] = useState(JSON.parse(localStorage.getItem('student')));

  const adminLogin = async (email, password) => {
    const res = await axios.post('http://localhost:5000/api/admin/login', { email, password });
    localStorage.setItem('admin', JSON.stringify(res.data));
    setAdmin(res.data);
    return res.data;
  };

  const studentLogin = async (details) => {
    const res = await axios.post('http://localhost:5000/api/student/login', details);
    localStorage.setItem('student', JSON.stringify(res.data));
    setStudent(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('student');
    setAdmin(null);
    setStudent(null);
  };

  return (
    <AuthContext.Provider value={{ admin, student, adminLogin, studentLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
