import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  RotateCcw,
  ArrowRight,
  SkipForward,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  X,
  VolumeX,
  Square,
} from 'lucide-react';
import { DIALOGUE_DATA, DialogueTurn } from '../data/dialogue';
import { CharacterAvatar, CharacterMood } from './CharacterAvatar';
import { speechService, isSpeechRecognitionSupported } from '../utils/speech';
import { compareSentences, ComparisonResult } from '../utils/comparator';

export interface TurnRecord {
  turnId: number;
  partnerQuestion: string;
  targetSentence: string;
  studentSpoken: string;
  attempts: number;
  isCompleted: boolean;
  isSkipped: boolean;
  missingWords: string[];
  feedbackEn: string;
  feedbackKo: string;
  category: string;
}

interface PracticeScreenProps {
  onFinishPractice: (records: TurnRecord[]) => void;
  onExit: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  onFinishPractice,
  onExit,
}) => {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const currentTurn: DialogueTurn = DIALOGUE_DATA[currentTurnIndex];

  // Speech state
  const [micState, setMicState] = useState<'ready' | 'listening' | 'done'>('ready');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [activeSpeechType, setActiveSpeechType] = useState<'normal' | 'slow' | 'question' | null>(null);

  // Spoken text & attempt count for current turn
  const [studentTranscript, setStudentTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  // Analysis & Feedback
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [feedback, setFeedback] = useState<{
    textEn: string;
    textKo: string;
    category: string;
    suggestedChunk?: string;
  } | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [characterMood, setCharacterMood] = useState<CharacterMood>('happy');

  // History records across all 5 turns
  const [records, setRecords] = useState<TurnRecord[]>([]);

  // Sound muted toggle
  const [isMuted, setIsMuted] = useState(false);

  // Track if current turn has been answered / can proceed
  const [canProceed, setCanProceed] = useState(false);

  // Recording Timer & Error tracking
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const [speechError, setSpeechError] = useState<{
    code: string;
    messageKo: string;
  } | null>(null);

  const mountedRef = useRef(true);
  const transcriptRef = useRef('');

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    mountedRef.current = true;
    speechService.setSpeakingListener((speaking) => {
      if (mountedRef.current) {
        setIsAudioPlaying(speaking);
        if (!speaking) {
          setActiveSpeechType(null);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  // When step changes, reset turn state and automatically speak partner's question
  useEffect(() => {
    speechService.stopListening();
    speechService.stopSpeaking();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
    setSpeechError(null);
    setMicState('ready');
    setStudentTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    setAttemptCount(0);
    setComparison(null);
    setFeedback(null);
    setCanProceed(false);
    setCharacterMood('happy');

    // Auto read-aloud the partner's question once (natural speed)
    if (!isMuted) {
      setActiveSpeechType('question');
      speechService.speak(currentTurn.partnerQuestion, 0.9, () => {
        if (mountedRef.current) setActiveSpeechType(null);
      });
    }
  }, [currentTurnIndex, isMuted]);

  // Audio Playback Helpers
  const handlePlayQuestion = () => {
    if (isAudioPlaying) {
      speechService.stopSpeaking();
      setActiveSpeechType(null);
      return;
    }
    setActiveSpeechType('question');
    setCharacterMood('talking');
    speechService.speak(currentTurn.partnerQuestion, 0.9, () => {
      setActiveSpeechType(null);
      setCharacterMood('happy');
    });
  };

  const handlePlayTargetNormal = () => {
    if (isAudioPlaying) {
      speechService.stopSpeaking();
      setActiveSpeechType(null);
      return;
    }
    setActiveSpeechType('normal');
    speechService.speak(currentTurn.studentTargetSentence, 0.9, () => {
      setActiveSpeechType(null);
    });
  };

  const handlePlayTargetSlow = () => {
    if (isAudioPlaying) {
      speechService.stopSpeaking();
      setActiveSpeechType(null);
      return;
    }
    setActiveSpeechType('slow');
    speechService.speak(currentTurn.studentTargetSentence, 0.7, () => {
      setActiveSpeechType(null);
    });
  };

  // Mic Button Action: Tap to Start -> Tap '녹음 중지' to Stop
  const handleToggleMic = () => {
    // Cannot speak while model audio is playing
    if (isAudioPlaying) {
      speechService.stopSpeaking();
    }

    if (micState === 'listening') {
      // 1) User clicked the button again to STOP recording!
      speechService.stopListening();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setMicState('done');
      setCharacterMood('thinking');

      // Immediately evaluate what was recorded
      const finalSpoken = (transcriptRef.current || studentTranscript || interimTranscript).trim();
      handleEvaluateSpeech(finalSpoken, !finalSpoken);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError({
        code: 'browser-unsupported',
        messageKo: '현재 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저에서 이용해 주세요.',
      });
      return;
    }

    // 1) User clicked to START recording!
    setSpeechError(null);
    transcriptRef.current = '';
    setStudentTranscript('');
    setInterimTranscript('');
    setMicState('listening');
    setCharacterMood('listening');
    setRecordingSeconds(0);

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    speechService.startListening({
      onStart: () => {
        setMicState('listening');
        setCharacterMood('listening');
      },
      onResult: (transcript, isFinal) => {
        transcriptRef.current = transcript;
        setInterimTranscript(transcript);
        if (isFinal) {
          setStudentTranscript(transcript);
        }
      },
      onError: (errorCode) => {
        console.warn('SpeechRecognition error:', errorCode);

        // Friendly Korean message mapping while keeping exact error code visible
        let messageKo = `오류가 발생했습니다: [${errorCode}]`;
        if (errorCode === 'not-allowed') {
          messageKo = '마이크 사용 권한이 거부되었습니다. 브라우저 주소창 설정에서 마이크를 허용해 주세요.';
        } else if (errorCode === 'no-speech') {
          messageKo = '아직 목소리가 감지되지 않았습니다. 마이크 가까이에서 말씀해 주세요! (녹음은 계속 켜져 있습니다)';
        } else if (errorCode === 'audio-capture') {
          messageKo = '마이크 입력 장치를 찾을 수 없습니다. 마이크 연결을 확인해 주세요.';
        } else if (errorCode === 'network') {
          messageKo = '음성 인식 네트워크 연결에 문제가 발생했습니다.';
        } else if (errorCode === 'service-not-allowed') {
          messageKo = '음성 인식 서비스가 허용되지 않았습니다.';
        }

        setSpeechError({
          code: errorCode,
          messageKo,
        });

        // Only critical permission/device errors reset the mic
        if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed' || errorCode === 'audio-capture') {
          speechService.stopListening();
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          setMicState('ready');
          setCharacterMood('happy');
        }
      },
      onEnd: () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setMicState('done');
      },
    });
  };

  // Evaluate speech and request Gemini/Rule-based feedback
  const handleEvaluateSpeech = async (spoken: string, isSilence: boolean) => {
    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);
    setStudentTranscript(spoken);

    if (isSilence || !spoken.trim()) {
      setCharacterMood('happy');
      const fallbackFeedback = {
        textEn: `That's okay! Let's try together. Tap the mic and say, “${currentTurn.studentTargetSentence}”`,
        textKo: `괜찮아요! 함께 해 봐요. 마이크를 누르고 “${currentTurn.studentTargetSentence}”라고 말해 보세요.`,
        category: 'silence',
      };
      setFeedback(fallbackFeedback);
      setComparison(compareSentences(currentTurn.studentTargetSentence, '', currentTurn.keyWords));
      setCanProceed(true);
      return;
    }

    // Compare sentences word-by-word
    const comp = compareSentences(currentTurn.studentTargetSentence, spoken, currentTurn.keyWords);
    setComparison(comp);

    if (comp.isIdentical || comp.isUnderstood) {
      setCharacterMood('cheering');
      setCanProceed(true);
    } else {
      setCharacterMood('thinking');
      setCanProceed(true);
    }

    setIsFetchingFeedback(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSentence: currentTurn.studentTargetSentence,
          studentSpeech: spoken,
          attemptCount: nextAttempt,
          turnNumber: currentTurn.id,
          koreanMeaning: currentTurn.studentTargetKo,
          missingWords: comp.missingWords,
          isSilence: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback({
          textEn: data.feedbackEn,
          textKo: data.feedbackKo,
          category: data.category,
          suggestedChunk: data.suggestedChunk,
        });
      } else {
        throw new Error('Server returned error');
      }
    } catch {
      // Deterministic Section 7 table fallback
      if (comp.isIdentical) {
        setFeedback({
          textEn: "Great job! I understood your self-introduction clearly.",
          textKo: "정말 잘했어요! 자기소개를 잘 알아들었어요.",
          category: 'success',
        });
      } else if (comp.onlySmallWordMissing) {
        setFeedback({
          textEn: `Nice try! You can say, “${currentTurn.studentTargetSentence}”`,
          textKo: "잘했어요! 작은 단어도 챙겨서 이렇게 말해 보세요.",
          category: 'small_missing',
        });
      } else if (nextAttempt === 1) {
        setFeedback({
          textEn: `Almost there! Let's say: “${currentTurn.studentTargetSentence}”`,
          textKo: "거의 다 왔어요! 이렇게 말해보세요.",
          category: 'recast',
        });
      } else if (nextAttempt === 2) {
        const missing = comp.missingWords[0] || 'word';
        setFeedback({
          textEn: `You're almost there! “${currentTurn.studentTargetSentence.replace(new RegExp(missing, 'i'), `${missing[0]}___`)}”`,
          textKo: `거의 다 했어요! 빠진 단어는 '${missing[0]}'로 시작해요.`,
          category: 'elicitation',
        });
      } else {
        const words = currentTurn.studentTargetSentence.split(' ');
        const mid = Math.ceil(words.length / 2);
        const p1 = words.slice(0, mid).join(' ');
        const p2 = words.slice(mid).join(' ');
        setFeedback({
          textEn: `Let's say it in two parts: “${p1}” ... “${p2}”`,
          textKo: `두 부분으로 나누어 말해 볼까요? 먼저 “${p1}” 다음 “${p2}”!`,
          category: 'chunking',
        });
      }
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const handleTryAgain = () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
    setSpeechError(null);
    transcriptRef.current = '';
    setMicState('ready');
    setStudentTranscript('');
    setInterimTranscript('');
    setComparison(null);
    setFeedback(null);
    setCharacterMood('happy');
  };

  const handleNextOrFinish = (isSkipped = false) => {
    speechService.stopListening();
    speechService.stopSpeaking();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
    setSpeechError(null);
    transcriptRef.current = '';

    const turnRecord: TurnRecord = {
      turnId: currentTurn.id,
      partnerQuestion: currentTurn.partnerQuestion,
      targetSentence: currentTurn.studentTargetSentence,
      studentSpoken: studentTranscript || (isSkipped ? '(스킵함)' : ''),
      attempts: attemptCount,
      isCompleted: !isSkipped && Boolean(studentTranscript),
      isSkipped: isSkipped,
      missingWords: comparison ? comparison.missingWords : [],
      feedbackEn: feedback ? feedback.textEn : '',
      feedbackKo: feedback ? feedback.textKo : '',
      category: feedback ? feedback.category : 'skip',
    };

    const newRecords = [...records, turnRecord];
    setRecords(newRecords);

    if (currentTurnIndex < DIALOGUE_DATA.length - 1) {
      setCurrentTurnIndex(currentTurnIndex + 1);
    } else {
      // Finished all 5 turns
      onFinishPractice(newRecords);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 flex flex-col justify-between p-3 sm:p-5 max-w-xl mx-auto select-none">
      {/* HEADER / NAVIGATION */}
      <div className="flex items-center justify-between pb-2 border-b border-orange-200/60">
        <button
          onClick={onExit}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-orange-100 transition-colors"
          title="홈으로 돌아가기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Tracker with 5 dots */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-amber-900 tracking-wide font-fun">
            Question {currentTurnIndex + 1} of {DIALOGUE_DATA.length}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {DIALOGUE_DATA.map((t, idx) => (
              <div
                key={t.id}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentTurnIndex
                    ? 'w-7 bg-orange-500 ring-2 ring-orange-200'
                    : idx < currentTurnIndex
                    ? 'w-2.5 bg-emerald-500'
                    : 'w-2.5 bg-amber-200'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-xl transition-colors ${
            isMuted ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:bg-orange-100'
          }`}
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* TOP: Friendly Character's Question in Speech Bubble + Korean Meaning */}
      <div className="pt-3">
        <div className="flex items-start gap-3 bg-white/95 rounded-3xl p-3.5 sm:p-4 shadow-sm border-2 border-amber-200">
          <CharacterAvatar mood={characterMood} size="md" name="Tobi" className="shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[11px] font-extrabold uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                Tobi's Question 🐻
              </span>
              <button
                onClick={handlePlayQuestion}
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full transition-colors ${
                  activeSpeechType === 'question'
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>질문 듣기</span>
              </button>
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-800 font-fun leading-snug">
              "{currentTurn.partnerQuestion}"
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {currentTurn.partnerQuestionKo}
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE: Target Sentence in LARGEST text + [Listen] [Slow] buttons */}
      <div className="my-auto py-3 text-center">
        <div className="bg-white/95 rounded-3xl p-4 sm:p-6 shadow-md border-2 border-orange-200 relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-200/40 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex items-center gap-1 text-xs font-extrabold text-orange-600 bg-orange-100 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Target Sentence (따라 말할 문장)</span>
          </div>

          {/* TARGET SENTENCE IN THE LARGEST TEXT */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-fun tracking-tight my-2 leading-tight">
            "{currentTurn.studentTargetSentence}"
          </div>

          <div className="text-sm sm:text-base font-bold text-emerald-700 mb-3">
            {currentTurn.studentTargetKo}
          </div>

          {/* Key Words guide chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
            <span className="text-[11px] font-bold text-slate-400">핵심 단어:</span>
            {currentTurn.keyWords.map((kw) => (
              <span
                key={kw}
                className="text-xs bg-sky-100 text-sky-800 font-extrabold px-2.5 py-0.5 rounded-lg border border-sky-200 shadow-2xs"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* Model Audio Listen Buttons: [🔊 Listen] [🐢 Slow] */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handlePlayTargetNormal}
              disabled={micState === 'listening'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all transform active:scale-95 shadow-sm ${
                activeSpeechType === 'normal'
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 Listen (기본 0.9x)</span>
            </button>

            <button
              onClick={handlePlayTargetSlow}
              disabled={micState === 'listening'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all transform active:scale-95 shadow-sm ${
                activeSpeechType === 'slow'
                  ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                  : 'bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300'
              }`}
            >
              <span className="text-base">🐢</span>
              <span>Slow (천천히 0.7x)</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM: Large round Mic Button + Word Analysis + Feedback Box + Actions */}
      <div className="space-y-3 pb-1">
        {/* SPEECH ERROR BANNER (Requirement 4: Display error name e.g. not-allowed, no-speech) */}
        {speechError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-900 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-md font-mono">
                  오류 이름: {speechError.code}
                </span>
                <button
                  onClick={() => setSpeechError(null)}
                  className="text-red-400 hover:text-red-600 p-0.5 rounded-full"
                  title="오류 안내 닫기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1 font-semibold text-slate-800">{speechError.messageKo}</p>
            </div>
          </div>
        )}

        {/* Word-by-Word Compare / Student Spoken Display */}
        {(studentTranscript || interimTranscript || micState === 'listening') && (
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-amber-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>내가 말한 내용 (You Spoke):</span>
              {micState === 'listening' && (
                <span className="text-red-600 font-extrabold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping" />
                  <span>실시간 듣는 중...</span>
                </span>
              )}
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-800 font-fun">
              {studentTranscript || interimTranscript ? `"${studentTranscript || interimTranscript}"` : "(소리를 내어 말씀해 보세요...)"}
            </p>

            {/* Word-by-word comparison highlight */}
            {comparison && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">단어 일치도:</span>
                {comparison.targetWords.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md font-fun transition-colors ${
                      item.matched
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.isSmallWord
                        ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 animate-pulse'
                        : 'bg-slate-100 text-slate-400 line-through'
                    }`}
                    title={item.matched ? '정확해요!' : item.isSmallWord ? '작은 단어 누락 주의!' : '다시 도전해봐요'}
                  >
                    {item.word}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK BOX (Section 7) */}
        {feedback && (
          <div
            className={`rounded-2xl p-3.5 shadow-sm border-2 animate-in fade-in duration-300 ${
              feedback.category === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : feedback.category === 'small_missing'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-sky-50 border-sky-300 text-sky-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl">
                {feedback.category === 'success'
                  ? '🌟'
                  : feedback.category === 'small_missing'
                  ? '💡'
                  : '🐻'}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/80">
                    {feedback.category === 'success'
                      ? '완벽해요! (Great!)'
                      : feedback.category === 'small_missing'
                      ? '작은 단어 팁 (Tip)'
                      : feedback.category === 'recast'
                      ? '다시 들어보기 (Listen)'
                      : feedback.category === 'elicitation'
                      ? '첫 글자 힌트 (Hint)'
                      : feedback.category === 'chunking'
                      ? '나누어 말하기 (Chunking)'
                      : '괜찮아요 (Encouragement)'}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold font-fun text-slate-900">
                  {feedback.textEn}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {feedback.textKo}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LARGE ROUND MIC BUTTON */}
        <div className="flex flex-col items-center justify-center pt-1">
          {/* Requirement 3: '녹음 중' 표시와 경과 시간 */}
          {micState === 'listening' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 border-2 border-rose-300 text-rose-700 rounded-full font-bold text-xs shadow-xs mb-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
              <span className="font-extrabold">녹음 중</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded-md text-rose-800 border border-rose-200">
                {formatTime(recordingSeconds)} ({recordingSeconds}초)
              </span>
            </div>
          )}

          {/* Mic Button with 3 States: Ready, Listening ('녹음 중지'), Done */}
          <button
            onClick={handleToggleMic}
            disabled={isAudioPlaying}
            className={`relative rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-xl transform active:scale-95 ${
              isAudioPlaying
                ? 'w-20 h-20 bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                : micState === 'listening'
                ? 'w-24 h-24 bg-rose-600 text-white ring-8 ring-rose-200 hover:bg-rose-700 animate-pulse'
                : micState === 'done'
                ? 'w-20 h-20 bg-emerald-500 text-white ring-4 ring-emerald-200 hover:bg-emerald-600'
                : 'w-20 h-20 bg-gradient-to-tr from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 ring-4 ring-orange-200'
            }`}
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-8 h-8 animate-bounce" />
                <span className="text-[10px] font-bold mt-1">듣는 중...</span>
              </>
            ) : micState === 'listening' ? (
              <>
                {/* Requirement 1: 버튼 글자가 '녹음 중지'로 바뀌게 해 줘 */}
                <Square className="w-7 h-7 fill-white text-white drop-shadow-sm" />
                <span className="text-xs font-black mt-1 tracking-tight">녹음 중지</span>
              </>
            ) : micState === 'done' ? (
              <>
                <CheckCircle2 className="w-8 h-8" />
                <span className="text-[10px] font-bold mt-0.5">다시 녹음</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8" />
                <span className="text-[10px] font-bold mt-0.5">말하기</span>
              </>
            )}
          </button>

          {/* Mic State Label description */}
          <div className="mt-2 text-xs font-extrabold text-slate-600 text-center">
            {isAudioPlaying ? (
              <span className="text-amber-700">소리를 듣고 있어요 (마이크 잠시 대기)</span>
            ) : micState === 'listening' ? (
              <div className="flex flex-col items-center text-rose-700">
                <span className="font-bold text-xs">
                  '녹음 중지' 버튼을 누르면 녹음이 완료되고 평가됩니다
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  (버튼을 누르기 전까지는 자동으로 멈추지 않습니다)
                </span>
              </div>
            ) : micState === 'done' ? (
              <span className="text-emerald-700 font-bold">✓ 녹음 완료! (버튼을 다시 누르면 재녹음할 수 있어요)</span>
            ) : (
              <span className="text-amber-900 font-fun">
                [말하기] 버튼을 누르면 녹음이 시작됩니다
              </span>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS: [Try Again] [Next →] [Skip] */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={handleTryAgain}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold border border-slate-300 shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Try Again (다시 시도)</span>
          </button>

          <button
            onClick={() => handleNextOrFinish(true)}
            className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs sm:text-sm font-bold border border-amber-200 transition-colors flex items-center justify-center gap-1"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip (넘어가기)</span>
          </button>

          <button
            onClick={() => handleNextOrFinish(false)}
            disabled={!canProceed && micState === 'ready'}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-fun font-bold flex items-center justify-center gap-1.5 shadow-md transition-all transform active:scale-95 ${
              canProceed || micState === 'done'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>
              {currentTurnIndex === DIALOGUE_DATA.length - 1
                ? '결과 보기 🎉'
                : 'Next → (다음)'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
