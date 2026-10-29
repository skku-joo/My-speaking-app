import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface FeedbackRequest {
  targetSentence: string;
  studentSpeech: string;
  attemptCount: number;
  turnNumber: number;
  koreanMeaning: string;
  missingWords?: string[];
  isSilence?: boolean;
}

interface FeedbackResponse {
  feedbackEn: string;
  feedbackKo: string;
  category: 'success' | 'small_missing' | 'recast' | 'elicitation' | 'chunking' | 'silence';
  suggestedChunk?: string;
  source: 'gemini' | 'rule_fallback';
}

function getRuleBasedFeedback(req: FeedbackRequest): FeedbackResponse {
  const { targetSentence, studentSpeech, attemptCount, missingWords = [], isSilence } = req;

  if (isSilence || !studentSpeech || studentSpeech.trim() === '') {
    return {
      feedbackEn: `That's okay! Let's try together. Tap the mic and say, “${targetSentence}”`,
      feedbackKo: `괜찮아요! 함께 해 봐요. 마이크를 누르고 “${targetSentence}”라고 말해 보세요.`,
      category: 'silence',
      source: 'rule_fallback',
    };
  }

  // Normalize comparison
  const cleanTarget = targetSentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const cleanStudent = studentSpeech.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // Perfect or near-perfect match
  if (cleanTarget === cleanStudent) {
    return {
      feedbackEn: "Great job! I understood your self-introduction clearly.",
      feedbackKo: "정말 잘했어요! 자기소개를 잘 알아들었어요.",
      category: 'success',
      source: 'rule_fallback',
    };
  }

  // Small word missing (like 'a', 'please', 'is', 'am', etc.)
  const smallWords = ['a', 'an', 'the', 'is', 'am', 'are', 'to', 'in', 'of', 'please'];
  const hasOnlySmallMissing = missingWords.length > 0 && missingWords.every(w => smallWords.includes(w.toLowerCase()));

  if (hasOnlySmallMissing || (missingWords.length === 1 && smallWords.includes(missingWords[0].toLowerCase()))) {
    return {
      feedbackEn: `Nice try! You can say, “${targetSentence}”`,
      feedbackKo: `잘했어요! 작은 단어까지 넣어서 이렇게 말해 보세요.`,
      category: 'small_missing',
      source: 'rule_fallback',
    };
  }

  // Failures progression
  if (attemptCount <= 1) {
    // 1st failure: Recast
    return {
      feedbackEn: `Almost there! Listen closely and say: “${targetSentence}”`,
      feedbackKo: `거의 다 왔어요! 잘 듣고 이렇게 말해 보세요.`,
      category: 'recast',
      source: 'rule_fallback',
    };
  } else if (attemptCount === 2) {
    // 2nd failure: Elicitation with blank
    const words = targetSentence.split(' ');
    // Pick the most important missing word or the first content word to elicit
    const focusWord = missingWords[0] || (words.length > 2 ? words[words.length - 1] : words[0]);
    const maskedSentence = targetSentence.replace(new RegExp(`\\b${focusWord}\\b`, 'i'), `${focusWord[0]}___`);

    return {
      feedbackEn: `You're almost there! “${maskedSentence}”`,
      feedbackKo: `거의 다 했어요! 비어있는 단어는 '${focusWord[0]}'로 시작해요.`,
      category: 'elicitation',
      suggestedChunk: focusWord,
      source: 'rule_fallback',
    };
  } else {
    // 3rd failure or more: Chunking
    const words = targetSentence.split(' ');
    const half = Math.ceil(words.length / 2);
    const part1 = words.slice(0, half).join(' ');
    const part2 = words.slice(half).join(' ');

    return {
      feedbackEn: `Let's say it in two parts: “${part1}” ... “${part2}”`,
      feedbackKo: `두 부분으로 나누어 말해 볼까요? 먼저 “${part1}” 다음 “${part2}”!`,
      category: 'chunking',
      suggestedChunk: part1,
      source: 'rule_fallback',
    };
  }
}

app.post('/api/feedback', async (req, res) => {
  const feedbackReq: FeedbackRequest = req.body;
  const { targetSentence, studentSpeech, attemptCount, missingWords = [], isSilence } = feedbackReq;

  // Rule-based check if silence
  if (isSilence || !studentSpeech || studentSpeech.trim() === '') {
    return res.json(getRuleBasedFeedback(feedbackReq));
  }

  // If no valid Gemini API key, use immediate rule-based fallback
  const apiKey = process.env.GEMINI_API_KEY;
  const isRealApiKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '';

  if (!isRealApiKey) {
    return res.json(getRuleBasedFeedback(feedbackReq));
  }

  try {
    const prompt = `You are a warm, encouraging English speaking coach for Korean elementary school students (Grades 5-6, CEFR A1 level).
The student is practicing a 5-turn English self-introduction dialogue.

Target sentence: "${targetSentence}"
What the student said: "${studentSpeech}"
Attempt number for this sentence: ${attemptCount}
Missing or different words: ${missingWords.join(', ') || 'none'}

Pedagogical Rules (CRITICAL):
1. Friendly and encouraging: Always praise effort first. Never say "wrong" or "incorrect".
2. CEFR A1 elementary level: Keep sentences short and simple.
3. Only ONE helpful suggestion at a time.
4. Adapt to attempt count:
   - If meaning is clear and accurate: praise intelligibility.
   - If only a small word (like 'a', 'is', 'the') is omitted: praise, then gently model: "Nice try! You can say, [Sentence]."
   - If 1st try failure: recast gently (repeat the correct sentence naturally).
   - If 2nd try failure: elicitation (give first letter hint like "h___").
   - If 3rd try failure: chunking (break into two short bite-sized phrases).
5. Output both English and natural Korean translation.

Return JSON strictly matching the schema.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), 2500)
    );

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedbackEn: {
              type: Type.STRING,
              description: 'Encouraging short feedback in English for CEFR A1 child',
            },
            feedbackKo: {
              type: Type.STRING,
              description: 'Natural Korean translation/explanation for Korean elementary student',
            },
            category: {
              type: Type.STRING,
              enum: ['success', 'small_missing', 'recast', 'elicitation', 'chunking', 'silence'],
              description: 'The pedagogical feedback category',
            },
            suggestedChunk: {
              type: Type.STRING,
              description: 'Optional focus word or chunk for elicitation/chunking',
            },
          },
          required: ['feedbackEn', 'feedbackKo', 'category'],
        },
      },
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);

    if (response.text) {
      const parsed = JSON.parse(response.text.trim()) as FeedbackResponse;
      return res.json({
        ...parsed,
        source: 'gemini',
      });
    }

    return res.json(getRuleBasedFeedback(feedbackReq));
  } catch (error) {
    console.warn('Gemini API call skipped or timed out, returning Section 7 rule-based feedback:', error);
    return res.json(getRuleBasedFeedback(feedbackReq));
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HelloMe speaking app server running on http://0.0.0.0:${port}`);
  });
}

startServer();
