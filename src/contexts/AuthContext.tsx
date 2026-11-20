import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildFallbackProfile(user: User): UserProfile {
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  return {
    id: user.id,
    email: user.email ?? null,
    full_name: meta.full_name || meta.name || null,
    avatar_url: meta.avatar_url || meta.picture || null,
    provider: appMeta.provider || 'google',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncAndFetchProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const fallback = buildFallbackProfile(currentUser);
    setProfile(fallback);

    try {
      const supabase = createClient();

      // Fetch from public.users
      const { data: existing, error: fetchError } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, provider')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (existing) {
        setProfile({
          id: existing.id,
          email: existing.email ?? fallback.email,
          full_name: existing.full_name || fallback.full_name,
          avatar_url: existing.avatar_url || fallback.avatar_url,
          provider: existing.provider ?? fallback.provider,
        });
        return;
      }

      if (!fetchError || fetchError.code === 'PGRST116') {
        // Fallback upsert if DB trigger hasn't populated yet
        const { data: upserted } = await supabase
          .from('users')
          .upsert(
            {
              id: currentUser.id,
              email: fallback.email,
              full_name: fallback.full_name,
              avatar_url: fallback.avatar_url,
              provider: fallback.provider,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select('id, email, full_name, avatar_url, provider')
          .maybeSingle();

        if (upserted) {
          setProfile(upserted);
        }
      }
    } catch (err) {
      console.warn('Failed to sync user profile with public.users:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const supabase = createClient();

        // Handle PKCE OAuth callback code if present in URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code).catch(() => {});
          window.history.replaceState({}, '', '/');
        } else if (window.location.hash.includes('access_token=')) {
          // Allow Supabase client to parse hash, then clean URL
          setTimeout(() => {
            if (window.location.hash.includes('access_token=')) {
              window.history.replaceState({}, '', '/');
            }
          }, 100);
        }

        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        await syncAndFetchProfile(initialSession?.user ?? null);

        const { data: listener } = supabase.auth.onAuthStateChange(
          async (event, nextSession) => {
            if (!mounted) return;
            setSession(nextSession);
            setUser(nextSession?.user ?? null);

            if (event === 'SIGNED_IN') {
              // Ensure clean main page URL after login
              if (
                window.location.pathname !== '/' ||
                window.location.search.includes('code=') ||
                window.location.hash.includes('access_token=')
              ) {
                window.history.replaceState({}, '', '/');
              }
            }

            await syncAndFetchProfile(nextSession?.user ?? null);
          }
        );

        unsubscribe = () => listener.subscription.unsubscribe();
      } catch (err) {
        console.warn('Supabase Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [syncAndFetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Google 로그인 중 오류가 발생했습니다.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await syncAndFetchProfile(user);
  }, [syncAndFetchProfile, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAuthenticated: Boolean(user),
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
