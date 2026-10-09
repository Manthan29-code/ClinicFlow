import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  login as loginThunk,
  register as registerThunk,
  logout as logoutAction,
  fetchCurrentUser,
} from '../store/slices/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, token, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // If token exists on load, restore session via GET /auth/me
    const storedToken = localStorage.getItem('clinicflow_token');
    if (storedToken) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  const login = async (credentials) => {
    const resultAction = await dispatch(loginThunk(credentials));
    if (loginThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw resultAction.payload || new Error('Login failed');
    }
  };

  const register = async (credentials) => {
    const resultAction = await dispatch(registerThunk(credentials));
    if (registerThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw resultAction.payload || new Error('Registration failed');
    }
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
