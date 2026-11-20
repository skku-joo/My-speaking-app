import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from './AuthContext';

export interface ActivityLogRecord {
  id: number;
  user_id: string;
  session_key: string;
  listen_count: number;
  shadowing_count: number;
  completed_turns: number;
  topic: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

interface ActivityContextValue {
  sessionKey: string;
  listenCount: number;
  shadowingCount: number;
  completedTurns: number;
  isSaving: boolean;
  lastSavedAt: string | null;
  saveError: string | null;
  recordListen: () => void;
  recordShadowing: () => void;
  updateCompletedTurns: (count: number) => void;
  saveCurrentSession: (overrideCompletedTurns?: number) => Promise<boolean>;
  resetSession: () => void;
  fetchActivityLogs: () => Promise<{ data: ActivityLogRecord[]; error: string | null }>;
}

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [sessionKey, setSessionKey] = useState<string>(() => generateUuid());
  const [listenCount, setListenCount] = useState(0);
  const [shadowingCount, setShadowingCount] = useState(0);
  const [completedTurns, setCompletedTurns] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sessionKeyRef = useRef(sessionKey);
  const listenRef = useRef(0);
  const shadowingRef = useRef(0);
  const completedRef = useRef(0);

  const persistToSupabase = useCallback(
    async (
      nextListen: number,
      nextShadowing: number,
      nextCompleted: number
    ): Promise<boolean> => {
      if (!user) return false;
      if (nextListen === 0 && nextShadowing === 0 && nextCompleted === 0) {
        return false;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        const supabase = createClient();
        const nowIso = new Date().toISOString();

        const { error } = await supabase
          .from('activity_logs')
          .upsert(
            {
              user_id: user.id,
              session_key: sessionKeyRef.current,
              listen_count: nextListen,
              shadowing_count: nextShadowing,
              completed_turns: nextCompleted,
              topic: 'My Self-Introduction',
              recorded_at: nowIso,
              updated_at: nowIso,
            },
            { onConflict: 'user_id,session_key' }
          );

        if (error) {
          console.warn('Failed to save activity log:', error);
          setSaveError(error.message);
          return false;
        }

        setLastSavedAt(nowIso);
        return true;
      } catch (err: any) {
        console.warn('Error saving activity log:', err);
        setSaveError(err?.message || '활동 기록 저장 중 오류가 발생했습니다.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  // If user logs in after accumulating local counts, persist automatically
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      (listenRef.current > 0 || shadowingRef.current > 0 || completedRef.current > 0)
    ) {
      persistToSupabase(listenRef.current, shadowingRef.current, completedRef.current);
    }
  }, [isAuthenticated, user, persistToSupabase]);

  const recordListen = useCallback(() => {
    const next = listenRef.current + 1;
    listenRef.current = next;
    setListenCount(next);
    if (user) {
      void persistToSupabase(next, shadowingRef.current, completedRef.current);
    }
  }, [user, persistToSupabase]);

  const recordShadowing = useCallback(() => {
    const next = shadowingRef.current + 1;
    shadowingRef.current = next;
    setShadowingCount(next);
    if (user) {
      void persistToSupabase(listenRef.current, next, completedRef.current);
    }
  }, [user, persistToSupabase]);

  const updateCompletedTurns = useCallback(
    (count: number) => {
      completedRef.current = count;
      setCompletedTurns(count);
      if (user) {
        void persistToSupabase(listenRef.current, shadowingRef.current, count);
      }
    },
    [user, persistToSupabase]
  );

  const saveCurrentSession = useCallback(
    async (overrideCompletedTurns?: number): Promise<boolean> => {
      const completed =
        typeof overrideCompletedTurns === 'number'
          ? overrideCompletedTurns
          : completedRef.current;

      if (typeof overrideCompletedTurns === 'number') {
        completedRef.current = overrideCompletedTurns;
        setCompletedTurns(overrideCompletedTurns);
      }

      return persistToSupabase(listenRef.current, shadowingRef.current, completed);
    },
    [persistToSupabase]
  );

  const resetSession = useCallback(() => {
    const newKey = generateUuid();
    sessionKeyRef.current = newKey;
    listenRef.current = 0;
    shadowingRef.current = 0;
    completedRef.current = 0;

    setSessionKey(newKey);
    setListenCount(0);
    setShadowingCount(0);
    setCompletedTurns(0);
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  const fetchActivityLogs = useCallback(async (): Promise<{
    data: ActivityLogRecord[];
    error: string | null;
  }> => {
    if (!user) {
      return { data: [], error: null };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: (data as ActivityLogRecord[]) || [], error: null };
    } catch (err: any) {
      return {
        data: [],
        error: err?.message || '활동 기록을 불러오는 중 오류가 발생했습니다.',
      };
    }
  }, [user]);

  return (
    <ActivityContext.Provider
      value={{
        sessionKey,
        listenCount,
        shadowingCount,
        completedTurns,
        isSaving,
        lastSavedAt,
        saveError,
        recordListen,
        recordShadowing,
        updateCompletedTurns,
        saveCurrentSession,
        resetSession,
        fetchActivityLogs,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export function useActivity(): ActivityContextValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return ctx;
}
