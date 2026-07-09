import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [courses, setCourses]             = useState([]);
  const [categories, setCategories]       = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [mockTests, setMockTests]         = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingMockTests, setLoadingMockTests] = useState(false);

  const fetchCourses = useCallback(async (filters = {}) => {
    setLoadingCourses(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await axios.get(`${API}/api/courses${params ? '?' + params : ''}`);
      setCourses(res.data);
      return res.data;
    } catch (err) {
      console.error('fetchCourses error:', err);
      return [];
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/categories`);
      setCategories(res.data);
      return res.data;
    } catch (err) {
      console.error('fetchCategories error:', err);
      return [];
    }
  }, []);

  const fetchMockTests = useCallback(async (courseId, userId = null) => {
    setLoadingMockTests(true);
    try {
      const url = `${API}/api/mock-tests/course/${courseId}${userId ? `?userId=${userId}` : ''}`;
      const res = await axios.get(url);
      setMockTests(res.data.mockTests || []);
      setSelectedCourse(res.data.course || null);
      return res.data;
    } catch (err) {
      console.error('fetchMockTests error:', err);
      return { mockTests: [], course: null };
    } finally {
      setLoadingMockTests(false);
    }
  }, []);

  const isPurchased = useCallback((mockTestId, userPurchases = []) => {
    return userPurchases.map(id => id?.toString()).includes(mockTestId?.toString());
  }, []);

  return (
    <CourseContext.Provider value={{
      courses, categories, selectedCourse, setSelectedCourse,
      mockTests, setMockTests,
      loadingCourses, loadingMockTests,
      fetchCourses, fetchCategories, fetchMockTests, isPurchased,
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);
