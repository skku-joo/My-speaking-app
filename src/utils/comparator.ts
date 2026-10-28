// Word-by-word sentence comparison logic for CEFR A1

export interface WordAnalysis {
  word: string;
  cleanWord: string;
  matched: boolean;
  isSmallWord: boolean;
  isKeyWord: boolean;
}

export interface ComparisonResult {
  targetWords: WordAnalysis[];
  studentWords: string[];
  missingWords: string[];
  missingSmallWords: string[];
  extraWords: string[];
  isIdentical: boolean;
  isUnderstood: boolean;
  onlySmallWordMissing: boolean;
  matchedKeyWordsCount: number;
  totalKeyWordsCount: number;
}

export const COMMON_SMALL_WORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'to', 'in', 'of', 'please', 'my', 'i'
]);

function cleanToken(token: string): string {
  let cleaned = token.toLowerCase().replace(/[^a-z0-9]/g, '');
  // normalize number 11 to eleven
  if (cleaned === '11') cleaned = 'eleven';
  return cleaned;
}

export function compareSentences(
  targetSentence: string,
  studentSpeech: string,
  keyWordsList: string[] = []
): ComparisonResult {
  const cleanTargetWords = targetSentence
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const cleanStudentTokens = studentSpeech
    .split(/\s+/)
    .map(cleanToken)
    .filter(Boolean);

  const keyWordsSet = new Set(keyWordsList.map(cleanToken));

  const matchedStudentIndices = new Set<number>();
  const targetWords: WordAnalysis[] = [];
  const missingWords: string[] = [];
  const missingSmallWords: string[] = [];

  let matchedKeyWordsCount = 0;

  for (const rawWord of cleanTargetWords) {
    const cleaned = cleanToken(rawWord);
    const isSmallWord = COMMON_SMALL_WORDS.has(cleaned);
    const isKeyWord = keyWordsSet.has(cleaned);

    // Look for matching token in student's speech
    let foundIndex = -1;
    for (let i = 0; i < cleanStudentTokens.length; i++) {
      if (!matchedStudentIndices.has(i) && cleanStudentTokens[i] === cleaned) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      matchedStudentIndices.add(foundIndex);
      targetWords.push({
        word: rawWord,
        cleanWord: cleaned,
        matched: true,
        isSmallWord,
        isKeyWord,
      });
      if (isKeyWord) {
        matchedKeyWordsCount++;
      }
    } else {
      targetWords.push({
        word: rawWord,
        cleanWord: cleaned,
        matched: false,
        isSmallWord,
        isKeyWord,
      });
      missingWords.push(rawWord.replace(/[^a-zA-Z0-9]/g, ''));
      if (isSmallWord) {
        missingSmallWords.push(rawWord.replace(/[^a-zA-Z0-9]/g, ''));
      }
    }
  }

  // Extra words student added
  const extraWords: string[] = [];
  for (let i = 0; i < cleanStudentTokens.length; i++) {
    if (!matchedStudentIndices.has(i)) {
      extraWords.push(cleanStudentTokens[i]);
    }
  }

  const isIdentical = missingWords.length === 0 && extraWords.length === 0;

  // Check if only small words were missed
  const onlySmallWordMissing =
    missingWords.length > 0 &&
    missingWords.every((w) => COMMON_SMALL_WORDS.has(cleanToken(w)));

  // Intelligibility check (Communication first):
  // At CEFR A1, if all or almost all key words are present and majority of words are matched,
  // the listener understands the student's message!
  const totalKeyWords = keyWordsList.length;
  const keyRatio = totalKeyWords > 0 ? matchedKeyWordsCount / totalKeyWords : 1;
  const isUnderstood = isIdentical || onlySmallWordMissing || keyRatio >= 0.66;

  return {
    targetWords,
    studentWords: cleanStudentTokens,
    missingWords,
    missingSmallWords,
    extraWords,
    isIdentical,
    isUnderstood,
    onlySmallWordMissing,
    matchedKeyWordsCount,
    totalKeyWordsCount: totalKeyWords,
  };
}
