// AI 챗봇 API 컨트롤러

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Res,
  UseGuards,
  Headers,
  Param,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ChatbotService } from './chatbot.service';
import { ChatbotQueryDto, ChatbotResponseDto, ChatbotHealthDto } from './dto/chatbot.dto';
import { 
  ChatbotHistoryQueryDto, 
  ChatbotSessionsQueryDto,
  ChatbotHistoryResponseDto,
  ChatbotSessionsResponseDto 
} from './dto/history.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * @api {POST} /chatbot/ask AI 챗봇에 질문하기
   * @apiName AskChatbot
   * @apiGroup Chatbot
   * 
   * @apiDescription 파이썬 AI 챗봇에 질문을 전송하고 답변을 받습니다.
   * 센서 데이터 질문(온도, 습도, 공기질)과 일반 질문을 모두 처리할 수 있습니다.
   * 
   * @apiHeader {String} X-API-Key API 인증 키 (필수)
   * @apiHeader {String} X-Session-Id 세션 ID (필수)
   * 
   * @apiBody {String} query 질문 내용
   * 
   * @apiSuccess {String} answer 챗봇 답변
   * @apiSuccess {String} route 라우팅 결과 (sensor/general/sensor_cache/sensor_detail/error)
   * @apiSuccess {String} session_id 세션 ID
   * @apiSuccess {Number} turn_id 턴 ID
   * @apiSuccess {Number} processing_time 처리 시간(초)
   * @apiSuccess {String} mode 처리 모드
   * @apiSuccess {Number} [docs_found] 검색된 문서 수
   * @apiSuccess {Number} [top_score] 최고 점수
   * 
   * @apiExample {curl} Example usage:
   *     curl -X POST http://localhost:3001/chatbot/ask \
   *          -H "Content-Type: application/json" \
   *          -H "X-API-Key: your-api-key" \
   *          -H "X-Session-Id: user123" \
   *          -d '{"query": "현재 온도가 어때?"}'
   * 
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "answer": "현재 온도는 25.5도입니다. 적정 온도로 편안해요!",
   *       "route": "sensor",
   *       "session_id": "20250813-142530-abc123",
   *       "turn_id": 1,
   *       "processing_time": 2.34,
   *       "mode": "rag",
   *       "docs_found": 3,
   *       "top_score": 95
   *     }
   */
  @UseGuards(ThrottlerGuard, ApiKeyGuard)
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async askChatbot(
    @Body(ValidationPipe) queryDto: ChatbotQueryDto,
    @Headers('x-session-id') sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChatbotResponseDto> {
    const result = await this.chatbotService.askChatbot(queryDto, sessionId);
    
    // 캐시 설정 - 센서 데이터는 짧게, 일반 질문은 길게
    if (result.route === 'sensor' || result.route === 'sensor_cache') {
      res.setHeader('Cache-Control', 'public, max-age=60'); // 1분
    } else {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5분
    }
    
    return result;
  }

  /**
   * @api {GET} /chatbot/health 챗봇 시스템 상태 확인
   * @apiName ChatbotHealth
   * @apiGroup Chatbot
   * 
   * @apiDescription 파이썬 설치 상태와 챗봇 모듈의 동작 상태를 확인합니다.
   * 모니터링이나 헬스체크에 사용할 수 있습니다.
   * 
   * @apiSuccess {String} status 전체 상태 (healthy/error)
   * @apiSuccess {Boolean} python_available 파이썬 설치 여부
   * @apiSuccess {Boolean} chatbot_module_available 챗봇 모듈 동작 여부
   * @apiSuccess {String} [error] 에러 메시지 (상태가 error인 경우)
   * 
   * @apiExample {curl} Example usage:
   *     curl -X GET http://localhost:3001/chatbot/health
   * 
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "healthy",
   *       "python_available": true,
   *       "chatbot_module_available": true
   *     }
   * 
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "error",
   *       "python_available": false,
   *       "chatbot_module_available": false,
   *       "error": "Python is not available"
   *     }
   */
  @Get('health')
  async checkHealth(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChatbotHealthDto> {
    const result = await this.chatbotService.checkHealth();
    
    // 헬스체크는 캐싱하지 않음
    res.setHeader('Cache-Control', 'no-cache');
    
    return result;
  }

  /**
   * @api {GET} /chatbot/history/:sessionId 특정 세션의 챗봇 히스토리 조회
   * @apiName GetChatbotHistory
   * @apiGroup Chatbot
   * 
   * @apiDescription 특정 세션 ID의 모든 대화 이력을 시간순으로 조회합니다.
   * 
   * @apiHeader {String} X-API-Key API 인증 키 (필수)
   * 
   * @apiParam {String} sessionId 조회할 세션 ID
   * @apiQuery {Number} [limit=20] 한 번에 가져올 턴 수 (1-100)
   * @apiQuery {String} [startDate] 시작 날짜 (YYYY-MM-DD)
   * @apiQuery {String} [endDate] 종료 날짜 (YYYY-MM-DD)
   * 
   * @apiSuccess {String} session_id 세션 ID
   * @apiSuccess {Number} total_turns 총 턴 수
   * @apiSuccess {Object[]} turns 대화 턴 배열
   * @apiSuccess {String} start_date 조회 시작 날짜
   * @apiSuccess {String} end_date 조회 종료 날짜
   * 
   * @apiExample {curl} Example usage:
   *     curl -X GET http://localhost:3001/chatbot/history/user123?limit=10 \
   *          -H "X-API-Key: your-api-key"
   * 
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "session_id": "user123",
   *       "total_turns": 5,
   *       "turns": [
   *         {
   *           "session_id": "user123",
   *           "turn_id": 1,
   *           "ts_kst": "2025-08-19 11:30:45",
   *           "route": "general",
   *           "query": "안녕하세요",
   *           "answer": "안녕하세요! 무엇을 도와드릴까요?",
   *           "docs": [],
   *           "last_sensor_ctx": {},
   *           "s3_key": "chatlog/user123/0001_1234567890.json"
   *         }
   *       ],
   *       "start_date": "2025-08-19",
   *       "end_date": "2025-08-19"
   *     }
   */
  @UseGuards(ThrottlerGuard, ApiKeyGuard)
  @Get('history/:sessionId')
  async getChatbotHistory(
    @Param('sessionId') sessionId: string,
    @Query(ValidationPipe) queryDto: ChatbotHistoryQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChatbotHistoryResponseDto> {
    const result = await this.chatbotService.getChatbotHistory(sessionId, queryDto);
    
    // 히스토리는 캐싱 (5분)
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    return result;
  }

  /**
   * @api {GET} /chatbot/sessions 챗봇 세션 목록 조회
   * @apiName GetChatbotSessions
   * @apiGroup Chatbot
   * 
   * @apiDescription 챗봇 세션 목록을 최신순으로 조회합니다.
   * 
   * @apiHeader {String} X-API-Key API 인증 키 (필수)
   * 
   * @apiQuery {Number} [limit=20] 한 번에 가져올 세션 수 (1-100)
   * @apiQuery {String} [startDate] 시작 날짜 (YYYY-MM-DD)
   * @apiQuery {String} [endDate] 종료 날짜 (YYYY-MM-DD)
   * 
   * @apiSuccess {Number} total_sessions 총 세션 수
   * @apiSuccess {Object[]} sessions 세션 배열
   * 
   * @apiExample {curl} Example usage:
   *     curl -X GET http://localhost:3001/chatbot/sessions?limit=10 \
   *          -H "X-API-Key: your-api-key"
   * 
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "total_sessions": 3,
   *       "sessions": [
   *         {
   *           "session_id": "user123",
   *           "first_turn_date": "2025-08-19 11:30:45",
   *           "last_turn_date": "2025-08-19 11:35:20",
   *           "total_turns": 5,
   *           "last_query": "고마워",
   *           "last_answer": "도움이 되어서 기뻐요!"
   *         }
   *       ]
   *     }
   */
  @UseGuards(ThrottlerGuard, ApiKeyGuard)
  @Get('sessions')
  async getChatbotSessions(
    @Query(ValidationPipe) queryDto: ChatbotSessionsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChatbotSessionsResponseDto> {
    const result = await this.chatbotService.getChatbotSessions(queryDto);
    
    // 세션 목록은 캐싱 (5분)
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    return result;
  }

  /**
   * @api {GET} /chatbot/history/date/:date 날짜별 챗봇 히스토리 조회
   * @apiName GetChatbotHistoryByDate
   * @apiGroup Chatbot
   * 
   * @apiDescription 특정 날짜의 모든 챗봇 대화 이력을 조회합니다.
   * 
   * @apiHeader {String} X-API-Key API 인증 키 (필수)
   * 
   * @apiParam {String} date 조회할 날짜 (YYYY-MM-DD)
   * @apiQuery {Number} [limit=50] 한 번에 가져올 턴 수 (1-100)
   * 
   * @apiExample {curl} Example usage:
   *     curl -X GET http://localhost:3001/chatbot/history/date/2025-08-19 \
   *          -H "X-API-Key: your-api-key"
   */
  @UseGuards(ThrottlerGuard, ApiKeyGuard)
  @Get('history/date/:date')
  async getChatbotHistoryByDate(
    @Param('date') date: string,
    @Query('limit') limit: number = 50,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChatbotHistoryResponseDto[]> {
    const result = await this.chatbotService.getChatbotHistoryByDate(date, limit);
    
    // 날짜별 히스토리는 긴 캐싱 (30분)
    res.setHeader('Cache-Control', 'public, max-age=1800');
    
    return result;
  }
}