export interface DialogueTurn {
  id: number;
  partnerQuestion: string;
  partnerQuestionKo: string;
  studentTargetSentence: string;
  studentTargetKo: string;
  keyWords: string[];
  smallWords: string[];
  phoneticsHint?: string;
  tipKo: string;
}

export const DIALOGUE_DATA: DialogueTurn[] = [
  {
    id: 1,
    partnerQuestion: "Hi! What's your name?",
    partnerQuestionKo: "안녕! 너의 이름은 뭐니?",
    studentTargetSentence: "Hi! My name is Jooeun.",
    studentTargetKo: "안녕! 내 이름은 주은이야.",
    keyWords: ["hi", "name", "jooeun"],
    smallWords: ["my", "is"],
    phoneticsHint: "내 이름을 자신감 있게 밝고 또렷하게 말해 보세요!",
    tipKo: "영어 자기소개의 시작! 'My name is ~' 뒤에 자신의 이름을 넣어서 말해보세요.",
  },
  {
    id: 2,
    partnerQuestion: "Nice to meet you! How old are you?",
    partnerQuestionKo: "만나서 반가워! 너는 몇 살이니?",
    studentTargetSentence: "I am 11 years old.",
    studentTargetKo: "나는 열한 살이야.",
    keyWords: ["eleven", "years", "old"],
    smallWords: ["i", "am"],
    phoneticsHint: "11은 '일레븐(eleven)', years의 's' 소리를 살려주세요!",
    tipKo: "나이를 말할 때는 'I am ~ years old.'라고 해요. 11살이면 eleven!",
  },
  {
    id: 3,
    partnerQuestion: "What do you like to do?",
    partnerQuestionKo: "너는 무엇을 하는 것을 좋아하니?",
    studentTargetSentence: "I like playing games.",
    studentTargetKo: "나는 게임 하는 것을 좋아해.",
    keyWords: ["like", "playing", "games"],
    smallWords: ["i"],
    phoneticsHint: "playing의 'p'와 games의 's'를 끝까지 말해보세요.",
    tipKo: "취미를 말할 때는 'I like ~ing' 패턴을 써요! (예: playing games)",
  },
  {
    id: 4,
    partnerQuestion: "Do you have any pets?",
    partnerQuestionKo: "너는 반려동물을 키우고 있니?",
    studentTargetSentence: "I have a small dog.",
    studentTargetKo: "나는 작은 강아지를 키워.",
    keyWords: ["have", "small", "dog"],
    smallWords: ["i", "a"],
    phoneticsHint: "강아지 앞에 작은 단어 'a'를 빠뜨리지 않고 부드럽게 연결해요!",
    tipKo: "셀 수 있는 동물이나 사물 앞에는 작은 단어 'a'를 꼭 붙여주는 것이 포인트!",
  },
  {
    id: 5,
    partnerQuestion: "What is your favorite food?",
    partnerQuestionKo: "네가 가장 좋아하는 음식은 무엇이니?",
    studentTargetSentence: "My favorite food is pizza.",
    studentTargetKo: "내가 가장 좋아하는 음식은 피자야.",
    keyWords: ["favorite", "food", "pizza"],
    smallWords: ["my", "is"],
    phoneticsHint: "favorite(페이보릿)은 '가장 좋아하는'이라는 멋진 단어예요.",
    tipKo: "가장 좋아하는 것을 말할 땐 'My favorite ~ is ...' 표현을 활용해요!",
  },
];
