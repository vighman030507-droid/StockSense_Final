import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check existing login on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        username,
        password,
      });

      // EXPECTED BACKEND RESPONSE:
      // {
      //   success: true,
      //   data: {
      //     token: "...",
      //     user: { id, username, role }
      //   }
      // }

      const token = response.data.data.token;
      const userData = response.data.data.user;

      if (!token || !userData) {
        throw new Error("Invalid login response format");
      }

      // Save token + user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      toast.success(`Welcome back, ${userData.username}!`);

      navigate('/dashboard');

      return { success: true };

    } catch (error) {
      console.error("LOGIN ERROR:", error);
      toast.error("Invalid username or password");
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

