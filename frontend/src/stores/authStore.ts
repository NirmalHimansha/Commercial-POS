import { create } from 'zustand';
import api from '../lib/api';
import { UserRole } from '../types';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('pos_token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithPin: async (pin: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login/pin', { pin });
      const { token, user } = response.data;

      localStorage.setItem('pos_token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      console.error('PIN login failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setPin: async (pin: string) => {
    try {
      await api.post('/auth/me/pin', { pin });
    } catch (error) {
      console.error('Setting PIN failed:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        set({ user: response.data, token, isLoading: false });
      } catch (error) {
        localStorage.removeItem('pos_token');
        set({ user: null, token: null, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));