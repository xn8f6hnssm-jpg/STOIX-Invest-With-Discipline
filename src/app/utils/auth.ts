// Authentication service
import { supabase } from './supabase';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { storage } from './storage';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  name: string;
  tradingStyle?: string;
  instruments?: string[];
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up new user
export async function signUp(data: SignUpData) {
  try {
    // First, check if username is available
    const usernameExists = await checkUsernameExists(data.username);
    if (usernameExists) {
      toast.error('Username already taken');
      return { success: false, error: 'Username already taken' };
    }

    // Create auth user via server (to auto-confirm email)
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ecfd718d/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      toast.error(error.message || 'Failed to create account');
      return { success: false, error: error.message };
    }

    const result = await response.json();
    
    toast.success('Account created! Please sign in.');
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Sign up error:', error);
    toast.error(error.message || 'Failed to create account');
    return { success: false, error: error.message };
  }
}

// Sign in existing user
export async function signIn(data: SignInData, skipProfileFetch?: boolean) {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email || '';

    // During onboarding, skip profile fetch and use metadata directly
    if (skipProfileFetch) {
      const userForStorage = {
        id: userId,
        email: userEmail,
        username: authData.user.user_metadata?.username || '',
        name: authData.user.user_metadata?.name || '',
        tradingStyle: '',
        instruments: [],
        isPremium: false,
        points: 0,
        level: 1,
        streak: 0,
        streakSavers: 0,
        createdAt: Date.now(),
        rules: []
      };
      
      // Use storage.setCurrentUser to ensure proper syncing to all_users
      storage.setCurrentUser(userForStorage as any);
      console.log('✅ User created from signup metadata:', userForStorage);
      
      toast.success('Welcome!');
      return { success: true, session: authData.session, user: authData.user };
    }
    
    // For regular login, fetch profile from server
    // For multi-account system, check if user already exists in localStorage
    const allUsers = storage.getAllUsers();
    const existingUser = allUsers.find((u: any) => u.id === userId);
    
    if (existingUser) {
      // User exists in our multi-account system, use that data
      storage.setCurrentUser(existingUser as any);
      console.log('✅ User found in multi-account system:', existingUser);
    } else {
      // New user, create minimal profile from auth data
      console.log('🔄 New user detected, creating profile...');
      const newUser = {
        id: userId,
        email: userEmail,
        username: authData.user.user_metadata?.username || '',
        name: authData.user.user_metadata?.name || '',
        tradingStyle: '',
        instruments: [],
        isPremium: false,
        points: 0,
        level: 1,
        streak: 0,
        streakSavers: 0,
        createdAt: Date.now(),
        rules: []
      };
      
      // Use storage.setCurrentUser to ensure proper syncing
      storage.setCurrentUser(newUser as any);
      console.log('✅ New user created in localStorage:', newUser);
    }

    toast.success('Welcome back!');
    return { success: true, session: authData.session, user: authData.user };
  } catch (error: any) {
    console.error('Sign in error:', error);
    toast.error('Failed to sign in');
    return { success: false, error: error.message };
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
      return { success: false, error: error.message };
    }
    toast.success('Signed out successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    toast.error('Failed to sign out');
    return { success: false, error: error.message };
  }
}

// Sign in with OAuth (Google, etc.)
export async function signInWithOAuth(provider: 'google' | 'github' | 'facebook') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/app`
      }
    });

    if (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('OAuth sign in error:', error);
    toast.error('Failed to sign in with ' + provider);
    return { success: false, error: error.message };
  }
}

// Check if username exists
async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ecfd718d/auth/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ username })
    });

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

// Get access token for API calls
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}