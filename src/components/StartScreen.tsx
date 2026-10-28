import React, { useState, useEffect } from 'react';
import { Play, BookOpen, ShieldCheck, AlertTriangle, Sparkles, Volume2 } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { isInAppBrowser, isSpeechRecognitionSupported, speechService } from '../utils/speech';

interface StartScreenProps {
  onStartPractice: () => void;
  onOpenReview: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartPractice,
  onOpenReview,
}) => {
  const [inApp, setInApp] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  const handlePlayGreeting = () => {
    setHasPlayedIntro(true);
    speechService.speak(
      "Hello! Ready to introduce yourself? Let's practice English together!",
      0.9
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100/70 flex flex-col justify-between p-4 sm:p-6 md:p-8 max-w-lg mx-auto select-none">
      {/* Warnings & In-App Alerts if needed */}
      <div className="space-y-2 mb-2">
        {inApp && (
          <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-sm animate-bounce">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">카카오톡 / 인스타그램 인앱 브라우저 안내</span>
              <p className="mt-0.5">
                마이크 음성 인식이 원활하지 않을 수 있어요. 우측 상단 메뉴(···)를 눌러 <strong>[다른 브라우저(Chrome/Safari)로 열기]</strong>를 권장합니다.
              </p>
            </div>
          </div>
        )}

        {!speechSupported && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-800 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">마이크 음성 인식 미지원 환경</span>
              <p className="mt-0.5">
                현재 브라우저에서 Web Speech API를 지원하지 않습니다. <strong>Google Chrome 브라우저</strong>에서 열어주세요!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TOP: App Name + Friendly Welcome Message */}
      <header className="text-center pt-2 sm:pt-4">
        {/* Cute Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-xs font-extrabold mb-2.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>초등 5~6학년 CEFR A1 영어 말하기</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 font-fun tracking-tight flex items-center justify-center gap-2">
          <span>HelloMe!</span>
          <span className="text-orange-500 text-2xl sm:text-3xl font-bold font-fun">
            - Introducing myself
          </span>
        </h1>

        <div className="mt-2 text-slate-600 font-bold text-base sm:text-lg flex items-center justify-center gap-2">
          <span>"Ready to introduce yourself?"</span>
          <button
            onClick={handlePlayGreeting}
            className="p-1.5 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors"
            title="인사말 듣기"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          (자기소개할 준비 되었나요? 친구와 5문장으로 대화해 봐요!)
        </p>
      </header>

      {/* MIDDLE: Illustration + Today's Practice Topic */}
      <main className="my-auto py-6 flex flex-col items-center text-center">
        {/* Animated Friendly Character Card */}
        <div className="relative mb-6">
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-orange-200 via-amber-100 to-yellow-100 p-2 shadow-xl border-4 border-white flex items-center justify-center relative">
            <CharacterAvatar mood="cheering" size="xl" name="Tobi" />

            {/* Speech Bubble floating */}
            <div className="absolute -top-3 -right-4 sm:-right-8 bg-white border-2 border-amber-300 rounded-2xl px-3.5 py-2 shadow-lg text-left max-w-[170px] animate-pulse">
              <p className="text-[11px] font-bold text-amber-900 leading-tight">
                "Hi! I'm Tobi! 🐻 Let's speak English!"
              </p>
              <p className="text-[9px] text-slate-500 font-medium">실수해도 괜찮아요!</p>
            </div>
          </div>
        </div>

        {/* Today's Practice Topic Badge */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-lg border-2 border-orange-200/80 max-w-sm w-full">
          <span className="text-xs font-black uppercase tracking-wider text-orange-500 bg-orange-100 px-2.5 py-0.5 rounded-full">
            Today's Practice
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-fun mt-2">
            “My Self-Introduction”
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
            (나의 자기소개: 이름, 나이, 취미, 반려동물, 최애 음식)
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-600">
            <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
              <span className="text-base block">👂</span>
              <span>1. 듣기 (Listen)</span>
            </div>
            <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
              <span className="text-base block">🎤</span>
              <span>2. 말하기 (Speak)</span>
            </div>
            <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
              <span className="text-base block">⭐</span>
              <span>3. 피드백 (Feedback)</span>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM: Start Practice + Review Buttons + Notice */}
      <footer className="space-y-3 pb-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onStartPractice}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-fun font-bold text-lg sm:text-xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>Start Practice (연습 시작)</span>
          </button>

          <button
            onClick={onOpenReview}
            className="py-3.5 px-5 rounded-2xl bg-white hover:bg-amber-50 text-amber-800 font-bold text-sm sm:text-base border-2 border-amber-300 shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Review (대화 둘러보기)</span>
          </button>
        </div>

        {/* Privacy Notice required by PRD Section 8 & Section 9 */}
        <div className="bg-white/70 rounded-xl px-3 py-2 border border-slate-200/80 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            학생의 목소리는 실시간 텍스트 변환에만 사용되며 녹음되거나 서버에 저장되지 않습니다.
          </span>
        </div>
      </footer>
    </div>
  );
};
