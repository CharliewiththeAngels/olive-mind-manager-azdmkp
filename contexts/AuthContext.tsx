
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { router } from 'expo-router';

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
    console.log('🔐 Initializing auth...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📱 Initial session:', session ? `Found (${session.user.email})` : 'None');
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
      console.log('🔄 Auth state changed:', _event, session ? `Session exists (${session.user.email})` : 'No session');
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        console.log('🚪 No session - clearing user state');
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('👤 Loading user profile for:', supabaseUser.email);
      console.log('📧 Email confirmed:', supabaseUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('🆔 User ID:', supabaseUser.id);
      
      // Fetch user profile from users table using the auth user ID
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('⚠️ Error loading user profile from users table:', error.message);
        
        // If user doesn't exist in users table, create a default profile
        console.log('📝 Creating default user profile...');
        const newUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: 'supervisor', // Default role
          name: supabaseUser.email?.split('@')[0] || 'User',
        };
        
        // Try to insert into users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: newUser.name,
            role: newUser.role,
          });
        
        if (insertError) {
          console.error('❌ Error creating user profile:', insertError.message);
        } else {
          console.log('✅ User profile created successfully');
        }
        
        setUser(newUser);
      } else if (data) {
        console.log('✅ User profile loaded:', data.email, `(${data.role})`);
        setUser({
          id: data.id,
          email: data.email,
          role: data.role as UserRole,
          name: data.name,
        });
      }
    } catch (error: any) {
      console.error('❌ Exception in loadUserProfile:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔑 Attempting login...');
      console.log('📧 Email:', email);
      console.log('🔒 Password length:', password.length);
      
      // Supabase auth is case-insensitive for emails, but we'll ensure lowercase
      const normalizedEmail = email.toLowerCase().trim();
      console.log('📧 Normalized email:', normalizedEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        console.error('📊 Error status:', error.status);
        console.error('📋 Error name:', error.name);
        
        // Provide specific error messages
        if (error.message.includes('Invalid login credentials')) {
          console.error('💡 Possible causes:');
          console.error('   - User does not exist in Supabase Auth');
          console.error('   - Password is incorrect');
          console.error('   - Email is incorrect');
          console.error('');
          console.error('💡 Solutions:');
          console.error('   1. Use the "Setup Accounts" button to create/fix accounts');
          console.error('   2. Check that the password is exactly: Olive@22! (for manager) or Sands#28! (for supervisor)');
          console.error('   3. Make sure email verification is complete');
        } else if (error.message.includes('Email not confirmed')) {
          console.error('💡 User needs to verify their email address');
          console.error('   Check the email inbox for verification link');
        } else if (error.message.includes('Email link is invalid or has expired')) {
          console.error('💡 Verification link has expired');
          console.error('   Request a new verification email');
        }
        
        return false;
      }

      if (data.user) {
        console.log('✅ Login successful!');
        console.log('👤 User ID:', data.user.id);
        console.log('📧 Email:', data.user.email);
        console.log('✉️ Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
        console.log('🕐 Last sign in:', data.user.last_sign_in_at);
        return true;
      }

      console.error('❌ Login failed: No user data returned');
      return false;
    } catch (error: any) {
      console.error('❌ Login exception:', error.message || error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process for user:', user?.email);
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error from Supabase:', error.message);
        // Don't throw - we still want to clear local state
      } else {
        console.log('✅ Successfully signed out from Supabase');
      }
      
      // Clear local state
      console.log('🧹 Clearing local auth state...');
      setUser(null);
      setSession(null);
      
      // Navigate to login screen
      console.log('🔄 Navigating to login screen...');
      router.replace('/login');
      
      console.log('✅ Logout process completed');
    } catch (error: any) {
      console.error('❌ Logout exception:', error.message);
      // Even if there's an error, clear local state and navigate
      setUser(null);
      setSession(null);
      router.replace('/login');
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
