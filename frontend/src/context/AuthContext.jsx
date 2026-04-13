import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const savedUser = localStorage.getItem('cattle_user');
    const savedToken = localStorage.getItem('cattle_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, ...userData } = res.data;
      
      setUser(userData);
      localStorage.setItem('cattle_user', JSON.stringify(userData));
      localStorage.setItem('cattle_token', token);
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.friendlyMessage || 'اسم المستخدم أو كلمة المرور غير صحيحة' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cattle_user');
    localStorage.removeItem('cattle_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
