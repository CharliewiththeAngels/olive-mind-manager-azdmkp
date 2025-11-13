
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

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
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Initializing auth...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session ? 'Found' : 'None');
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session ? 'Session exists' : 'No session');
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', supabaseUser.email);
      
      // Fetch user profile from users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // If user doesn't exist in users table, create a default profile
        const newUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: 'supervisor', // Default role
          name: supabaseUser.email?.split('@')[0] || 'User',
        };
        setUser(newUser);
      } else if (data) {
        console.log('User profile loaded:', data.email, data.role);
        setUser({
          id: data.id,
          email: data.email,
          role: data.role as UserRole,
          name: data.name,
        });
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      if (data.user) {
        console.log('Login successful for:', email);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login exception:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user:', user?.email);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout exception:', error);
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
    session,
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
