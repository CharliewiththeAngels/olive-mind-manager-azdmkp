
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'manager' | 'supervisor';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isManager: () => boolean;
  isSupervisor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration - in a real app, this would come from a backend
const MOCK_USERS: { [key: string]: { password: string; user: User } } = {
  'manager@olivemind.com': {
    password: 'manager123',
    user: {
      id: '1',
      email: 'manager@olivemind.com',
      role: 'manager',
      name: 'Manager User',
    },
  },
  'supervisor@olivemind.com': {
    password: 'supervisor123',
    user: {
      id: '2',
      email: 'supervisor@olivemind.com',
      role: 'supervisor',
      name: 'Supervisor User',
    },
  },
};

const AUTH_STORAGE_KEY = '@auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      console.log('Loading stored user...');
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Found stored user:', parsedUser.email, parsedUser.role);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = MOCK_USERS[email.toLowerCase()];
      
      if (mockUser && mockUser.password === password) {
        console.log('Login successful for:', email, 'Role:', mockUser.user.role);
        setUser(mockUser.user);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser.user));
        return true;
      } else {
        console.log('Login failed for:', email);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user:', user?.email);
      setUser(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isManager = () => user?.role === 'manager';
  const isSupervisor = () => user?.role === 'supervisor';

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isManager,
    isSupervisor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
