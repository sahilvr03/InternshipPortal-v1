'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const AuthContext = createContext();

// Create Axios instance with base URL
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Don't redirect; let components handle 403
      return Promise.reject({
        ...error,
        isPermissionError: true,
        message: error.response.data.details || 'You do not have permission to access this resource.',
      });
    } else if (error.response?.status === 401) {
      console.error('Authentication failed:', error.response.data);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/Login';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userString = localStorage.getItem('user');
        if (userString) {
          try {
            const userData = JSON.parse(userString);
            setUser(userData);
            // Silently verify token
            verifyToken(token);
          } catch (err) {
            console.error('Error parsing user data:', err);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          await verifyToken(token);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const verifyToken = async (token) => {
      try {
        const response = await axiosInstance.get('/api/verify-token', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    loadUserFromStorage();
  }, []);

  // Updated login function to support both email and username
  const login = async (identifier, password) => {
    try {
      const isEmail = identifier.includes('@');
      const loginData = { password };

      if (isEmail) {
        loginData.email = identifier;
      } else {
        loginData.username = identifier;
      }

      const response = await axiosInstance.post('/api/student/login', loginData);

      const { token, studentId, name, role } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        const userData = {
          id: studentId,
          name,
          role: role || 'student',
          [isEmail ? 'email' : 'username']: identifier,
        };

        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return { success: true, role: role || 'student' };
      }

      throw new Error('Invalid login response');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.error || 'Login failed. Please check your credentials.'
      );
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/Login');
  };

  const checkApiStatus = async () => {
    try {
      const response = await axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkApiStatus,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);