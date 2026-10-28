import React from 'react';
import { DIALOGUE_DATA } from '../data/dialogue';
import { speechService } from '../utils/speech';
import { Volume2, X, Sparkles, BookOpen } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onStartPractice,
}) => {
  const [playingId, setPlayingId] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const handlePlay = (id: number, text: string) => {
    setPlayingId(id);
    speechService.speak(text, 0.85, () => {
      setPlayingId(null);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-4 border-amber-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-fun font-bold">Dialogue Review (대화 미리보기)</h2>
              <p className="text-xs text-amber-100 font-medium">5가지 자기소개 문장을 먼저 들어보고 익혀봐요!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of 5 turns */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {DIALOGUE_DATA.map((item) => (
            <div
              key={item.id}
              className="bg-amber-50/60 hover:bg-amber-50/90 rounded-2xl p-4 border border-amber-200 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center font-fun">
                    #{item.id}
                  </span>
                  <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    Partner Question
                  </span>
                </div>
                <button
                  onClick={() => handlePlay(item.id, `${item.partnerQuestion} ... ${item.studentTargetSentence}`)}
                  disabled={playingId === item.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform active:scale-95 shadow-sm ${
                    playingId === item.id
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-white text-amber-700 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {playingId === item.id ? '재생 중...' : '전체 듣기'}
                </button>
              </div>

              {/* Partner question */}
              <div className="mt-2 text-slate-700 text-sm font-semibold pl-2 border-l-2 border-amber-300">
                💬 {item.partnerQuestion}
                <div className="text-xs text-slate-500 font-normal mt-0.5">{item.partnerQuestionKo}</div>
              </div>

              {/* Student target sentence */}
              <div className="mt-3 bg-white rounded-xl p-3 border border-orange-200">
                <div className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 내가 말할 문장 (My target sentence)
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 font-fun">
                  "{item.studentTargetSentence}"
                </div>
                <div className="text-xs text-emerald-700 font-medium mt-1">
                  뜻: {item.studentTargetKo}
                </div>

                {/* Key words & Tips */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">핵심 단어:</span>
                  {item.keyWords.map((kw) => (
                    <span
                      key={kw}
                      className="text-[11px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg">
                  💡 <span className="font-semibold">말하기 꿀팁:</span> {item.phoneticsHint || item.tipKo}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CharacterAvatar mood="happy" size="sm" />
            <span>준비되면 언제든 연습을 시작해보세요!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              닫기
            </button>
            <button
              onClick={() => {
                onClose();
                onStartPractice();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-md transition-transform active:scale-95"
            >
              연습 시작하기 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
