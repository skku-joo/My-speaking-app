// Speech Recognition and Synthesis Utilities

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
  const inAppPatterns = [
    /KAKAOTALK/i,
    /Instagram/i,
    /NAVER/i,
    /FB_IAB/i,
    /FBAN/i,
    /FBAV/i,
    /Line/i,
    /Twitter/i,
    /Snapchat/i,
  ];
  return inAppPatterns.some((pattern) => pattern.test(ua));
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorCode: string) => void;
  onEnd?: () => void;
}

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private shouldKeepListening = false;
  private restartTimeout: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private onSpeakingStateChange?: (speaking: boolean) => void;
  private handlers: SpeechRecognitionHandlers | null = null;
  private accumulatedFinal = '';

  public setSpeakingListener(listener: (speaking: boolean) => void) {
    this.onSpeakingStateChange = listener;
  }

  public speak(
    text: string,
    rate: number = 0.9,
    onFinish?: () => void,
    lang: string = 'en-US'
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onFinish) onFinish();
      return;
    }

    // Cancel ongoing audio
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // 0.9 for normal, 0.7 for slow
    utterance.pitch = 1.05; // Slightly cheerful, friendly pitch for kids

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.isSpeaking = true;
    if (this.onSpeakingStateChange) this.onSpeakingStateChange(true);

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onSpeakingStateChange) this.onSpeakingStateChange(false);
      if (onFinish) onFinish();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onSpeakingStateChange) this.onSpeakingStateChange(false);
      if (onFinish) onFinish();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onSpeakingStateChange) this.onSpeakingStateChange(false);
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public startListening(handlers: SpeechRecognitionHandlers) {
    if (!isSpeechRecognitionSupported()) {
      handlers.onError?.('BROWSER_UNSUPPORTED');
      return;
    }

    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    this.handlers = handlers;
    this.shouldKeepListening = true;
    this.accumulatedFinal = '';

    this.initAndStart();
  }

  private initAndStart() {
    if (!this.shouldKeepListening) return;

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.handlers?.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            sessionFinal += item[0].transcript + ' ';
          } else {
            sessionInterim += item[0].transcript;
          }
        }

        if (sessionFinal) {
          this.accumulatedFinal = (this.accumulatedFinal + ' ' + sessionFinal).trim();
        }

        const fullText = (this.accumulatedFinal + ' ' + sessionInterim).trim();
        if (fullText) {
          this.handlers?.onResult?.(fullText, Boolean(sessionFinal));
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        const errorCode = event.error || 'unknown-error';

        // Notify UI about the error with the exact error name
        this.handlers?.onError?.(errorCode);

        // If permission was denied, do not continue restarting
        if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
          this.shouldKeepListening = false;
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;

        // Requirement 2:
        // If the user has not pressed the stop button (shouldKeepListening is true),
        // automatically restart SpeechRecognition immediately!
        if (this.shouldKeepListening) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.shouldKeepListening) {
              try {
                this.recognition?.start();
              } catch {
                this.initAndStart();
              }
            }
          }, 100);
        } else {
          this.handlers?.onEnd?.();
        }
      };

      this.recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition', err);
      const errName = err?.name || 'START_FAILED';
      this.handlers?.onError?.(errName);
      if (errName === 'NotAllowedError') {
        this.shouldKeepListening = false;
      }
    }
  }

  public stopListening() {
    this.shouldKeepListening = false;
    clearTimeout(this.restartTimeout);
    this.isListening = false;

    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();
