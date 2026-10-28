import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { PracticeScreen, TurnRecord } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { ReviewModal } from './components/ReviewModal';
import { CheckSquare, Sparkles, X } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'practice' | 'result'>('start');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [practiceRecords, setPracticeRecords] = useState<TurnRecord[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);

  const handleStartPractice = () => {
    setIsReviewOpen(false);
    setCurrentScreen('practice');
  };

  const handleFinishPractice = (records: TurnRecord[]) => {
    setPracticeRecords(records);
    setCurrentScreen('result');
  };

  const handleRestartPractice = () => {
    setPracticeRecords([]);
    setCurrentScreen('practice');
  };

  const handleGoHome = () => {
    setPracticeRecords([]);
    setCurrentScreen('start');
  };

  return (
    <div className="relative min-h-screen bg-slate-100 flex flex-col justify-center items-center">
      {/* Main Screen Container with mobile smartphone frame styling on desktop, full-width on mobile */}
      <div className="w-full max-w-md md:max-w-lg min-h-screen sm:min-h-[92vh] sm:my-4 sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-white flex flex-col relative border-0 sm:border-4 sm:border-amber-200">
        {currentScreen === 'start' && (
          <StartScreen
            onStartPractice={handleStartPractice}
            onOpenReview={() => setIsReviewOpen(true)}
          />
        )}

        {currentScreen === 'practice' && (
          <PracticeScreen
            onFinishPractice={handleFinishPractice}
            onExit={handleGoHome}
          />
        )}

        {currentScreen === 'result' && (
          <ResultScreen
            records={practiceRecords}
            onRestart={handleRestartPractice}
            onHome={handleGoHome}
          />
        )}

        {/* Review Modal */}
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onStartPractice={handleStartPractice}
        />
      </div>

      {/* Floating Teacher / Student PRD Checklist Button (bottom right on desktop/tablet) */}
      <div className="fixed bottom-3 right-3 z-40">
        <button
          onClick={() => setShowChecklist(!showChecklist)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 text-white text-xs font-bold shadow-lg hover:bg-slate-900 transition-transform active:scale-95"
          title="PRD 체크리스트 확인"
        >
          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>PRD Checklist</span>
        </button>
      </div>

      {/* PRD Checklist Drawer */}
      {showChecklist && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border-2 border-amber-300 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Section 9 Completion Checklist
                </h3>
              </div>
              <button
                onClick={() => setShowChecklist(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 mt-3 text-xs text-slate-700">
              <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <span className="font-bold">The mic button visibly changes to "Listening"</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ready [🎤 Tap to Speak] → Listening [🔴 Listening…] → Done [✓ Recording Complete]
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <span className="font-bold">What the student said appears as text</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    실시간 음성 인식 전사 및 일치 단어(초록)/누락 단어(노랑) 색상 분석
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <span className="font-bold">Capitalization and punctuation are not penalized</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    대소문자와 문장부호(!, ?)는 무시하고 단어 의미 중심으로 평가
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <span className="font-bold">Saying nothing shows "Let's try together"</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    무응답 시 "That's okay! Let's try together. Tap the mic..." 격려 제공
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <span className="font-bold">After all sentences, Result Screen appears</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    완주 기준 별점(⭐⭐⭐), 문장별 피드백, 전체 자기소개 다시 듣기 지원
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                <span className="text-sky-600 font-bold">✓</span>
                <div>
                  <span className="font-bold">Technical Requirements</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Web Speech API (en-US), 음성 합성 속도(보통 0.9 / 느리게 0.7), 모델 재생 중 마이크 비활성화, 1.5초 무음 자동 완료, Gemini + Section 7 Fallback 탑재
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowChecklist(false)}
              className="w-full mt-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
