// 챗봇 히스토리 조회 API DTO 정의

import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

// 히스토리 조회 요청 DTO
export class ChatbotHistoryQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20; // 한 번에 가져올 턴 수

  @IsOptional()
  @IsString()
  startDate?: string; // YYYY-MM-DD 형태

  @IsOptional()
  @IsString()
  endDate?: string; // YYYY-MM-DD 형태
}

// 세션 목록 조회 요청 DTO
export class ChatbotSessionsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20; // 한 번에 가져올 세션 수

  @IsOptional()
  @IsString()
  startDate?: string; // YYYY-MM-DD 형태

  @IsOptional()
  @IsString()
  endDate?: string; // YYYY-MM-DD 형태
}

// 문서 메타데이터 타입
export interface DocumentMeta {
  key?: string;
  score?: number;
  schema?: string;
  tag?: string;
  file_size?: number;
}

// 센서 컨텍스트 타입
export interface SensorContext {
  window?: string;
  start?: string;
  end?: string;
  tag?: string;
  label?: string;
}

// 단일 대화 턴 응답 DTO
export class ChatbotTurnDto {
  session_id: string;
  turn_id: number;
  ts_kst: string; // KST 타임스탬프
  route: 'sensor' | 'general' | 'sensor_cache' | 'sensor_detail';
  query: string;
  answer: string;
  docs: DocumentMeta[];
  last_sensor_ctx: SensorContext;
  s3_key: string; // S3에서 가져온 키
}

// 세션 히스토리 응답 DTO
export class ChatbotHistoryResponseDto {
  session_id: string;
  total_turns: number;
  turns: ChatbotTurnDto[];
  start_date: string;
  end_date: string;
}

// 세션 목록 응답 DTO
export class ChatbotSessionDto {
  session_id: string;
  first_turn_date: string;
  last_turn_date: string;
  total_turns: number;
  last_query: string;
  last_answer: string;
}

export class ChatbotSessionsResponseDto {
  total_sessions: number;
  sessions: ChatbotSessionDto[];
}