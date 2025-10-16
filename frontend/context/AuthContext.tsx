import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Safe localStorage wrapper for SSR
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is not available
    }
  }
};

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  wallet_address?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, full_name: string, role: string) => Promise<void>;
  connectWallet: (walletAddress: string, fullName: string, email: string, role: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run after component is mounted and we're on client side
    if (!mounted || typeof window === 'undefined') {
      if (mounted) setLoading(false);
      return;
    }

    try {
      const storedToken = safeLocalStorage.getItem('token');
      const storedUser = safeLocalStorage.getItem('user');
      const storedWalletAddress = safeLocalStorage.getItem('walletAddress');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate token with backend
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
          fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (response.ok) {
              // Token is valid
              setToken(storedToken);
              setUser(parsedUser);
            } else {
              // Token is invalid, clear storage
              console.log('Token expired or invalid, clearing auth state');
              safeLocalStorage.removeItem('token');
              safeLocalStorage.removeItem('user');
              safeLocalStorage.removeItem('walletAddress');
            }
          })
          .catch(error => {
            // Network error, use stored data anyway
            console.warn('Token validation failed due to network error, using stored auth state');
            setToken(storedToken);
            setUser(parsedUser);
          });
          
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          safeLocalStorage.removeItem('token');
          safeLocalStorage.removeItem('user');
          safeLocalStorage.removeItem('walletAddress');
        }
      } else if (storedWalletAddress) {
        // If we have a wallet address but no user/token, clear it
        safeLocalStorage.removeItem('walletAddress');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      const userData = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role
      };
      
      if (typeof window !== 'undefined') {
        safeLocalStorage.setItem('token', data.token);
        safeLocalStorage.setItem('user', JSON.stringify(userData));
        safeLocalStorage.setItem('rememberMe', rememberMe.toString());
        
        // If remember me is checked, set a longer expiration marker
        if (rememberMe) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
          safeLocalStorage.setItem('tokenExpiration', expirationDate.toISOString());
        }
      }
      setToken(data.token);
      setUser(userData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    safeLocalStorage.removeItem('token');
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('walletAddress');
    safeLocalStorage.removeItem('rememberMe');
    safeLocalStorage.removeItem('tokenExpiration');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const register = async (email: string, password: string, full_name: string, role: string) => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name, role })
      });
      
      if (!response.ok) {
        let message = 'Registration failed';
        try {
          const errorData = await response.json();
          message = errorData.detail || errorData.message || message;
        } catch {
          try {
            const text = await response.text();
            if (text) message = text;
          } catch {}
        }
        throw new Error(message);
      }
      
      const data = await response.json();
      const userData = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role
      };
      
      if (typeof window !== 'undefined') {
        safeLocalStorage.setItem('token', data.token);
        safeLocalStorage.setItem('user', JSON.stringify(userData));
      }
      setToken(data.token);
      setUser(userData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (walletAddress: string, fullName: string, email: string, role: string) => {
    try {
      // Attempt to register/login by wallet (best-effort), else store minimal user
      try {
        const resp = await fetch('/api/auth/wallet-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: walletAddress, fullName, email, role }),
        });
        if (resp.ok) {
          const data = await resp.json();
          // Require a real token and user from backend; no fallbacks
          if (!data?.token || !data?.user) {
            throw new Error('Invalid auth response from server');
          }
          if (typeof window !== 'undefined') {
            safeLocalStorage.setItem('token', data.token);
            safeLocalStorage.setItem('user', JSON.stringify(data.user));
            safeLocalStorage.setItem('walletAddress', walletAddress);
          }
          setToken(data.token);
          setUser(data.user);
          return;
        } else {
          // If wallet registration fails, extract error message
          let errorMessage = 'Wallet registration failed';
          try {
            const errorData = await resp.json();
            errorMessage = errorData.message || errorData.detail || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Wallet registration error details:', error);
        if (error instanceof Error) {
          throw error; // Re-throw if it's already a proper Error
        }
        // Convert any non-Error objects to Error with string message
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'Failed to connect wallet';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // Ensure we always throw a proper Error instance with a string message
      if (error instanceof Error) {
        throw error;
      }
      // Convert any non-Error objects to Error with string message
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? String(error.message) 
        : typeof error === 'string' 
          ? error 
          : 'Failed to connect wallet';
      throw new Error(errorMessage);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        safeLocalStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  const setAuth = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem('token', newToken);
      safeLocalStorage.setItem('user', JSON.stringify(newUser));
      if (newUser.wallet_address) {
        safeLocalStorage.setItem('walletAddress', newUser.wallet_address);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      register, 
      connectWallet, 
      updateUser,
      setAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}; 