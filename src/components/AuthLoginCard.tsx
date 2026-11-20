import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, X, Loader2 } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { useAuth } from '../contexts/AuthContext';

interface AuthLoginCardProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const AuthLoginCard: React.FC<AuthLoginCardProps> = ({
  onClose,
  isModal = false,
}) => {
  const { signInWithGoogle, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && isModal && onClose) {
      onClose();
    }
  }, [isAuthenticated, isModal, onClose]);

  const handleGoogleLogin = async () => {
    setStatusMessage(null);
    setLoading(true);

    const { error } = await signInWithGoogle();
    if (error) {
      setStatusMessage(error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100/90 rounded-3xl max-w-sm w-full shadow-2xl border-2 border-amber-200 overflow-hidden relative">
      {/* Top close button for popup */}
      {isModal && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border border-amber-200 flex items-center justify-center shadow-2xs transition-colors cursor-pointer z-10"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Top branding & Tobi character matching StartScreen */}
      <div className="pt-7 pb-5 px-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-[11px] font-extrabold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>HelloMe! - Introducing myself</span>
        </div>

        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-200 via-amber-100 to-yellow-100 p-1.5 shadow-lg border-4 border-white flex items-center justify-center">
            <CharacterAvatar mood="cheering" size="lg" name="Tobi" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-800 font-fun tracking-tight">
          HelloMe! 시작하기
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5 leading-relaxed">
          Google 계정으로 간편하게 로그인하고
          <br />
          Tobi와 함께 영어 자기소개를 연습해 보세요!
        </p>
      </div>

      {/* Login action box (Google login only, no signup/login split) */}
      <div className="px-6 pb-6 space-y-3.5">
        <div className="bg-white/95 rounded-2xl p-4 border border-orange-200/80 shadow-sm space-y-3">
          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold text-center">
              {statusMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-amber-50/70 text-slate-800 font-bold text-sm sm:text-base border-2 border-amber-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Google로 계속하기</span>
          </button>

          <p className="text-[11px] text-center text-slate-400 font-medium">
            별도의 회원가입 없이 Google 계정으로 바로 시작할 수 있어요
          </p>
        </div>

        {/* Privacy note matching main page */}
        <div className="bg-white/70 rounded-xl px-3 py-2 border border-slate-200/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>목소리 녹음 파일은 저장되지 않습니다</span>
        </div>
      </div>
    </div>
  );
};
