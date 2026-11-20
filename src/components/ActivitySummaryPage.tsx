import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Headphones,
  Mic,
  Clock,
  RefreshCw,
  CalendarCheck,
  Sparkles,
  LogIn,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useActivity, ActivityLogRecord } from '../contexts/ActivityContext';
import { CharacterAvatar } from './CharacterAvatar';

interface ActivitySummaryPageProps {
  onBackToHome: () => void;
  onStartPractice: () => void;
}

function formatTimestamp(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export const ActivitySummaryPage: React.FC<ActivitySummaryPageProps> = ({
  onBackToHome,
  onStartPractice,
}) => {
  const { isAuthenticated, profile, signInWithGoogle } = useAuth();
  const {
    listenCount,
    shadowingCount,
    completedTurns,
    isSaving,
    lastSavedAt,
    saveError,
    saveCurrentSession,
    fetchActivityLogs,
  } = useActivity();

  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!isAuthenticated) {
      setLogs([]);
      return;
    }
    setLoadingLogs(true);
    setFetchError(null);
    const { data, error } = await fetchActivityLogs();
    if (error) {
      setFetchError(error);
    }
    setLogs(data);
    setLoadingLogs(false);
  }, [isAuthenticated, fetchActivityLogs]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs, lastSavedAt]);

  const handleManualSave = async () => {
    const ok = await saveCurrentSession();
    if (ok) {
      await loadLogs();
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setFetchError(error);
      setLoginLoading(false);
    }
  };

  // Aggregate totals across saved records (or fallback to current session if not logged in)
  const totalListening = isAuthenticated
    ? logs.reduce((sum, item) => sum + (item.listen_count || 0), 0)
    : listenCount;

  const totalShadowing = isAuthenticated
    ? logs.reduce((sum, item) => sum + (item.shadowing_count || 0), 0)
    : shadowingCount;

  const totalCompletedTurns = isAuthenticated
    ? logs.reduce((sum, item) => sum + (item.completed_turns || 0), 0)
    : completedTurns;

  const totalActions = totalListening + totalShadowing;
  const listenPercent = totalActions > 0 ? Math.round((totalListening / totalActions) * 100) : 50;
  const shadowingPercent = totalActions > 0 ? 100 - listenPercent : 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100/70 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto select-none">
      {/* TOP BAR */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>메인으로</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => void loadLogs()}
              disabled={loadingLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          )}
        </div>

        {/* PAGE TITLE */}
        <header className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-[11px] font-extrabold mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>My Learning Activity Summary</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-fun">
            나의 학습 활동 요약
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
            {isAuthenticated
              ? `${profile?.full_name || profile?.email || '학습자'}님의 듣기 및 쉐도잉 연습 기록이에요!`
              : '지금까지의 듣기 및 쉐도잉 활동 내역이에요!'}
          </p>
        </header>

        {/* LOGIN PROMPT IF NOT AUTHENTICATED */}
        {!isAuthenticated && (
          <div className="bg-white/95 rounded-2xl p-4 border-2 border-amber-300 shadow-sm mb-4 flex items-center gap-3">
            <CharacterAvatar mood="happy" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-slate-800">
                Google 로그인으로 학습 기록을 저장하세요!
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                로그인하면 듣기/쉐도잉 횟수와 시간이 안전하게 기록됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              disabled={loginLoading}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer hover:from-orange-600 hover:to-amber-600 disabled:opacity-60"
            >
              {loginLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>로그인</span>
            </button>
          </div>
        )}

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-2xl p-4 border-2 border-amber-200 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-extrabold mb-1">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                <Headphones className="w-4 h-4 text-amber-600" />
              </div>
              <span>총 듣기 학습</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-fun">
              {totalListening}
              <span className="text-sm font-bold text-slate-500 ml-1">회</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 text-orange-700 text-xs font-extrabold mb-1">
              <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center">
                <Mic className="w-4 h-4 text-orange-600" />
              </div>
              <span>총 쉐도잉</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-fun">
              {totalShadowing}
              <span className="text-sm font-bold text-slate-500 ml-1">회</span>
            </div>
          </div>
        </div>

        {/* BALANCE & SESSION OVERVIEW */}
        <div className="bg-white/95 rounded-2xl p-4 border border-amber-200 shadow-sm mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>누적 학습 세션: {isAuthenticated ? logs.length : (listenCount + shadowingCount > 0 ? 1 : 0)}회</span>
            </span>
            <span className="text-emerald-700 font-extrabold">
              완료 문장 {totalCompletedTurns}개
            </span>
          </div>

          {/* Visual Ratio Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${listenPercent}%` }}
              title={`듣기 ${listenPercent}%`}
            />
            <div
              className="bg-orange-500 transition-all duration-500"
              style={{ width: `${shadowingPercent}%` }}
              title={`쉐도잉 ${shadowingPercent}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              듣기 비율 ({totalActions > 0 ? `${listenPercent}%` : '0%'})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              쉐도잉 비율 ({totalActions > 0 ? `${shadowingPercent}%` : '0%'})
            </span>
          </div>

          {/* Current session live info + manual save button */}
          {(listenCount > 0 || shadowingCount > 0) && (
            <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-600 font-semibold">
                현재 세션: 듣기 <strong>{listenCount}회</strong> · 쉐도잉 <strong>{shadowingCount}회</strong>
              </span>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : lastSavedAt ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  <span>{isSaving ? '저장 중...' : lastSavedAt ? '저장됨' : '지금 저장'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {(saveError || fetchError) && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {saveError || fetchError}
          </div>
        )}
      </div>

      {/* TIMESTAMPED ACTIVITY LOG LIST */}
      <main className="flex-1 overflow-y-auto max-h-[38vh] space-y-2.5 pr-0.5 mb-4">
        <h2 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider px-1">
          상세 활동 타임라인 (Timestamp History)
        </h2>

        {!isAuthenticated ? (
          <div className="bg-white/80 rounded-2xl p-6 text-center border border-amber-200/80 text-xs text-slate-500 font-medium">
            로그인 후 학습한 기록이 이곳에 타임스탬프와 함께 저장됩니다.
          </div>
        ) : loadingLogs ? (
          <div className="bg-white/80 rounded-2xl p-6 flex items-center justify-center gap-2 border border-amber-200/80 text-xs text-amber-800 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>기록을 불러오는 중입니다...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-6 text-center border border-amber-200/80">
            <p className="text-xs font-bold text-slate-700">
              아직 저장된 학습 기록이 없어요!
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              연습을 시작해서 문장을 듣고 따라 말해보세요.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl p-3.5 border border-orange-200/80 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {log.topic}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatTimestamp(log.recorded_at || log.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-amber-50/80 rounded-xl py-1.5 px-2 border border-amber-100">
                  <span className="text-[10px] font-bold text-slate-500 block">듣기 학습</span>
                  <span className="text-sm font-black text-amber-800 font-fun">
                    {log.listen_count}회
                  </span>
                </div>
                <div className="bg-orange-50/80 rounded-xl py-1.5 px-2 border border-orange-100">
                  <span className="text-[10px] font-bold text-slate-500 block">쉐도잉</span>
                  <span className="text-sm font-black text-orange-700 font-fun">
                    {log.shadowing_count}회
                  </span>
                </div>
                <div className="bg-emerald-50/80 rounded-xl py-1.5 px-2 border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-500 block">완료 문장</span>
                  <span className="text-sm font-black text-emerald-700 font-fun">
                    {log.completed_turns} / 5
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* BOTTOM CTA */}
      <footer className="pt-2 border-t border-orange-200/60">
        <button
          type="button"
          onClick={onStartPractice}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-fun font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <span>새로운 연습 시작하기 🚀</span>
        </button>
      </footer>
    </div>
  );
};
