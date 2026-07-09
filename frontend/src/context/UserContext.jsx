import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('es_user')); } catch { return null; }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [notifications, setNotifications] = useState([]);
  const [pendingCourseId, setPendingCourseId] = useState(null); // after login, navigate here
  const [pendingExamId, setPendingExamId] = useState(null);    // after login, go to instructions

  const openLogin = (courseId = null) => {
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
    if (courseId) setPendingCourseId(courseId);
  };

  // Open login modal and remember which exam to start after auth
  const openLoginForExam = (examId) => {
    setPendingExamId(examId);
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalTab('register');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const register = async (data) => {
    const res = await axios.post(`${API}/api/users/register`, data);
    localStorage.setItem('es_user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await axios.post(`${API}/api/users/verify-otp`, { email, otp });
    return res.data;
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API}/api/users/login`, { email, password });
    localStorage.setItem('es_user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('es_user');
    setUser(null);
    setNotifications([]);
  };

  const updatePurchases = (newPurchases) => {
    const updated = { ...user, purchases: newPurchases };
    localStorage.setItem('es_user', JSON.stringify(updated));
    setUser(updated);
  };

  const addPurchase = (id) => {
    const current = user?.purchases || [];
    const updated = [...new Set([...current.map(p => p.toString()), id.toString()])];
    updatePurchases(updated);
  };

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API}/api/notifications/user/${userId}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('fetchNotifications error:', err);
    }
  }, []);

  const markNotificationRead = async (notifId) => {
    try {
      await axios.patch(`${API}/api/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const updateUserProfile = async (data) => {
    const res = await axios.put(`${API}/api/users/profile`, data, {
      headers: { Authorization: `Bearer ${user?.token}` }
    });
    const updated = { ...user, ...res.data };
    localStorage.setItem('es_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  return (
    <UserContext.Provider value={{
      user, register, verifyOtp, login, logout,
      updatePurchases, addPurchase, updateUserProfile,
      isAuthModalOpen, authModalTab, openLogin, openRegister, openLoginForExam, closeAuthModal,
      pendingCourseId, setPendingCourseId,
      pendingExamId, setPendingExamId,
      notifications, fetchNotifications, markNotificationRead, unreadCount,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
