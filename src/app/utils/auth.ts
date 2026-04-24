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

// ── Save user profile to Supabase users table ─────────────────────────────────
async function saveUserToSupabase(user: any, accessToken: string) {
  try {
    console.log('🔄 Attempting to save to Supabase...', user.id);
    console.log('🔑 Access token exists:', !!accessToken);

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.username || '',
        name: user.name || '',
        trading_style: user.tradingStyle || '',
        instruments: user.instruments || [],
        total_points: user.totalPoints || 0,
        clean_days: user.cleanDays || 0,
        forfeit_days: user.forfeitDays || 0,
        current_streak: user.currentStreak || 0,
        followers: user.followers || 0,
        following: user.following || 0,
        is_verified: user.isVerified || false,
        is_premium: user.isPremium || false,
        streak_savers: user.streakSavers || 0,
        achievements: user.achievements || [],
      }, { onConflict: 'id' });

    console.log('📊 Supabase response - data:', data, 'error:', error);

    if (error) {
      console.error('❌ Supabase upsert error:', JSON.stringify(error));
    } else {
      console.log('✅ User saved to Supabase successfully');
    }
  } catch (err) {
    console.error('❌ saveUserToSupabase exception:', err);
  }
}

// ── Load user profile from Supabase users table ───────────────────────────────
async function loadUserFromSupabase(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('No user profile in Supabase yet');
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      username: data.username,
      name: data.name,
      tradingStyle: data.trading_style,
      instruments: data.instruments || [],
      totalPoints: data.total_points || 0,
      cleanDays: data.clean_days || 0,
      forfeitDays: data.forfeit_days || 0,
      currentStreak: data.current_streak || 0,
      followers: data.followers || 0,
      following: data.following || 0,
      isVerified: data.is_verified || false,
      isPremium: data.is_premium || false,
      premiumSince: data.premium_since || null,
      profilePicture: data.profile_picture || null,
      streakSavers: data.streak_savers || 0,
      doubleXPDaysRemaining: data.double_xp_days_remaining || 0,
      accountProtectionMode: data.account_protection_mode || false,
      preTradeChecklistEnabled: data.pre_trade_checklist_enabled || false,
      accountRules: data.account_rules || {},
      achievements: data.achievements || [],
      rules: [],
    };
  } catch (err) {
    console.error('loadUserFromSupabase error:', err);
    return null;
  }
}

// Sign up new user
export async function signUp(data: SignUpData) {
  try {
    // Check username availability directly in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', data.username)
      .maybeSingle();

    if (existingUser) {
      toast.error('Username already taken');
      return { success: false, error: 'Username already taken' };
    }

    // Sign up directly via Supabase Auth
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { username: data.username, name: data.name }
      }
    });

    if (error) {
      toast.error(error.message || 'Failed to create account');
      return { success: false, error: error.message };
    }

    toast.success('Account created! Please sign in.');
    return { success: true, user: authData.user };
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
    const accessToken = authData.session?.access_token || '';

    console.log('🔐 Signed in successfully, userId:', userId);
    console.log('🔑 Session access token:', accessToken ? 'EXISTS' : 'MISSING');

    if (skipProfileFetch) {
      const newUser = {
        id: userId,
        email: userEmail,
        username: authData.user.user_metadata?.username || '',
        name: authData.user.user_metadata?.name || '',
        tradingStyle: '',
        instruments: [],
        totalPoints: 0,
        cleanDays: 0,
        forfeitDays: 0,
        currentStreak: 0,
        followers: 0,
        following: 0,
        isVerified: false,
        isPremium: false,
        streakSavers: 0,
        doubleXPDaysRemaining: 0,
        accountProtectionMode: false,
        preTradeChecklistEnabled: false,
        accountRules: {},
        achievements: [],
        rules: [],
      };

      storage.setCurrentUser(newUser as any);
      await saveUserToSupabase(newUser, accessToken);
      toast.success('Welcome!');
      return { success: true, session: authData.session, user: authData.user };
    }

    // Regular login — try Supabase first, fall back to localStorage
    const supabaseUser = await loadUserFromSupabase(userId);

    if (supabaseUser) {
      storage.setCurrentUser(supabaseUser as any);
      console.log('✅ User loaded from Supabase');
    } else {
      const allUsers = storage.getAllUsers();
      const existingUser = allUsers.find((u: any) => u.id === userId);

      if (existingUser) {
        storage.setCurrentUser(existingUser as any);
        await saveUserToSupabase(existingUser, accessToken);
        console.log('✅ Migrated localStorage user to Supabase');
      } else {
        const newUser = {
          id: userId,
          email: userEmail,
          username: authData.user.user_metadata?.username || '',
          name: authData.user.user_metadata?.name || '',
          tradingStyle: '',
          instruments: [],
          totalPoints: 0,
          cleanDays: 0,
          forfeitDays: 0,
          currentStreak: 0,
          followers: 0,
          following: 0,
          isVerified: false,
          isPremium: false,
          streakSavers: 0,
          doubleXPDaysRemaining: 0,
          accountProtectionMode: false,
          preTradeChecklistEnabled: false,
          accountRules: {},
          achievements: [],
          rules: [],
        };
        storage.setCurrentUser(newUser as any);
        await saveUserToSupabase(newUser, accessToken);
        console.log('✅ New user created in localStorage + Supabase');
      }
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

// Sign in with OAuth
export async function signInWithOAuth(provider: 'google' | 'github' | 'facebook') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/app` }
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

// Sync current user profile to Supabase
export async function syncUserToSupabase() {
  try {
    const user = storage.getCurrentUser();
    const token = await getAccessToken();
    if (!user || !token) return;
    await saveUserToSupabase(user, token);
  } catch (err) {
    console.error('syncUserToSupabase error:', err);
  }
}
