// src/constants/index.ts
export const CHATBOT_CONSTANTS = {
  MAX_HISTORY: 50,
  MAX_MESSAGE_LENGTH: 300,  // ✅ 반드시 존재
  MIN_MESSAGE_LENGTH: 1,
  TYPING_DELAY_MS: 250,
  REQUEST_TIMEOUT_MS: 30000,
} as const;

export const UI_CONSTANTS = {} as const;

export const ERROR_MESSAGES = {
  CHATBOT: {
    EMPTY_MESSAGE: '메시지를 입력해주세요.',
    TOO_LONG: `메시지는 ${CHATBOT_CONSTANTS.MAX_MESSAGE_LENGTH}자 이내로 입력해주세요.`,
    PROCESSING_ERROR: '답변 생성 중 오류가 발생했습니다.',
    CONNECTION_ERROR: '챗봇 서버에 연결할 수 없습니다.',
    VALIDATION_ERROR: '입력값이 올바르지 않습니다.',
  },
} as const;

export default {
  CHATBOT_CONSTANTS,
  ERROR_MESSAGES,
};
