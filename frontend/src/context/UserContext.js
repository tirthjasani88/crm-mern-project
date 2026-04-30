import React, { createContext, useContext, useReducer, useEffect } from 'react';
import API from '../utils/axios';

const UserContext = createContext();

const initialState = {
  user: null,
  loading: true,
  error: null
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await API.get('/auth/me');

      if (response.data.success) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await API.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
        return { success: true };
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.data.message });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await API.post('/auth/register', userData);

      if (response.data.success) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
        return { success: true };
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.data.message });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await API.get('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};