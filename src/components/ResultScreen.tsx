import React, { useState } from 'react';
import { Star, Volume2, RotateCcw, Home, Sparkles, Check, AlertCircle } from 'lucide-react';
import { TurnRecord } from './PracticeScreen';
import { CharacterAvatar } from './CharacterAvatar';
import { speechService } from '../utils/speech';
import { DIALOGUE_DATA } from '../data/dialogue';

interface ResultScreenProps {
  records: TurnRecord[];
  onRestart: () => void;
  onHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  records,
  onRestart,
  onHome,
}) => {
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playingTurnId, setPlayingTurnId] = useState<number | null>(null);

  // Star calculation based on PRD Section 6:
  // ⭐⭐⭐ Completed all 5 turns and practiced every sentence.
  // ⭐⭐ Completed 3–4 turns of the dialogue.
  // ⭐ Finished the whole dialogue
  const completedCount = records.filter((r) => r.isCompleted && !r.isSkipped).length;

  let starCount = 1;
  let starMessage = '끝까지 대화를 완주했어요! 참 잘했어요!';

  if (completedCount === 5) {
    starCount = 3;
    starMessage = '5가지 문장을 모두 직접 소리 내어 연습했어요! 최고예요! ⭐⭐⭐';
  } else if (completedCount >= 3) {
    starCount = 2;
    starMessage = '3~4개 문장을 훌륭하게 연습했어요! 멋져요! ⭐⭐';
  } else {
    starCount = 1;
    starMessage = '포기하지 않고 5개 대화를 모두 마쳤어요! 대단해요! ⭐';
  }

  // Continuous read-aloud of the student's full self-introduction
  const handlePlayFullIntroduction = () => {
    if (isPlayingAll) {
      speechService.stopSpeaking();
      setIsPlayingAll(false);
      return;
    }

    const fullIntro = DIALOGUE_DATA.map((d) => d.studentTargetSentence).join(' ');
    setIsPlayingAll(true);
    speechService.speak(fullIntro, 0.85, () => {
      setIsPlayingAll(false);
    });
  };

  const handlePlaySingle = (turnId: number, sentence: string) => {
    if (playingTurnId === turnId) {
      speechService.stopSpeaking();
      setPlayingTurnId(null);
      return;
    }
    setPlayingTurnId(turnId);
    speechService.speak(sentence, 0.9, () => {
      setPlayingTurnId(null);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto select-none">
      {/* TOP: Encouraging message + Stars */}
      <header className="text-center pt-2 sm:pt-4">
        <div className="flex justify-center mb-2">
          <CharacterAvatar mood="cheering" size="lg" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-black mb-2">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Practice Completed!</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-fun">
          “Great job! You finished today's practice!”
        </h1>
        <p className="text-sm font-bold text-slate-600 mt-1">
          (오늘의 연습을 모두 마쳤어요! 정말 대단해요!)
        </p>

        {/* Stars Display (Reward completion, not accuracy) */}
        <div className="mt-4 bg-white/90 rounded-2xl p-4 shadow-sm border border-amber-200 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((starIdx) => (
              <Star
                key={starIdx}
                className={`w-9 h-9 transition-transform duration-300 ${
                  starIdx <= starCount
                    ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-md'
                    : 'fill-slate-200 text-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="text-xs sm:text-sm font-extrabold text-amber-900 mt-2">
            {starMessage}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            (완주 기준 평가: 실수 여부와 관계없이 끝까지 연습한 노력을 칭찬합니다)
          </p>
        </div>
      </header>

      {/* MIDDLE: Speaking Results Cards */}
      <main className="my-4 overflow-y-auto max-h-[46vh] space-y-3 px-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            나의 말하기 결과 (My Speaking Results)
          </h2>
          <span className="text-xs font-bold text-orange-600">
            총 5문장 중 {completedCount}문장 소리내어 연습함
          </span>
        </div>

        {records.map((rec) => {
          const matchedTurn = DIALOGUE_DATA.find((d) => d.id === rec.turnId);
          return (
            <div
              key={rec.turnId}
              className="bg-white rounded-2xl p-4 shadow-sm border border-orange-200/80 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center font-fun">
                    #{rec.turnId}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Q: {rec.partnerQuestion}
                  </span>
                </div>
                <button
                  onClick={() => handlePlaySingle(rec.turnId, rec.targetSentence)}
                  className={`p-1.5 rounded-full text-xs transition-colors ${
                    playingTurnId === rec.turnId
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                  title="다시 듣기"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Target Sentence */}
              <div className="mt-2 text-base font-bold text-slate-800 font-fun">
                "{rec.targetSentence}"
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {matchedTurn?.studentTargetKo}
              </div>

              {/* What the student spoke */}
              <div className="mt-2.5 bg-amber-50/70 rounded-xl p-2.5 border border-amber-100 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-bold mb-1">
                  <span>내가 말한 내용:</span>
                  {rec.isCompleted ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 말하기 완료
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">건너뜀 (Skip)</span>
                  )}
                </div>
                <div className="text-slate-800 font-fun font-bold text-sm">
                  {rec.studentSpoken ? `"${rec.studentSpoken}"` : '(녹음된 음성 없음)'}
                </div>

                {/* Highlighted missing words (e.g., 'a', 'please', small words) */}
                {rec.missingWords && rec.missingWords.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 flex flex-wrap items-center gap-1">
                    <span className="text-[11px] font-semibold text-amber-800">
                      다음엔 이 단어도 챙겨보세요:
                    </span>
                    {rec.missingWords.map((mw) => (
                      <span
                        key={mw}
                        className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[11px] font-bold"
                      >
                        {mw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Supportive note on intelligibility */}
              {rec.feedbackEn && (
                <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg font-medium">
                  💬 <span className="font-bold">칭찬 피드백:</span> {rec.feedbackEn} ({rec.feedbackKo})
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* BOTTOM: Action Buttons */}
      <footer className="space-y-2.5 pt-2 border-t border-orange-200/60">
        <button
          onClick={handlePlayFullIntroduction}
          className={`w-full py-3.5 px-4 rounded-2xl font-fun font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md ${
            isPlayingAll
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300'
          }`}
        >
          <Volume2 className="w-5 h-5 text-amber-600" />
          <span>
            {isPlayingAll
              ? '전체 자기소개 들려주는 중...'
              : '🔊 Listen Again (전체 자기소개 완성본 연속 듣기)'}
          </span>
        </button>

        <div className="flex gap-2.5">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Try Again (다시 연습하기)</span>
          </button>

          <button
            onClick={onHome}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-fun font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Finish (처음 화면으로)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
