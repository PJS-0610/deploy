// 환경 추천 API 컨트롤러

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
} from '@nestjs/common';
import type { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RecommendService } from './recommend.service';
import { RecommendQueryDto, RecommendResponseDto, RecommendHealthDto } from './dto/recommend.dto';

@Controller('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  /**
   * @api {POST} /recommend/optimal 최적 환경 추천
   * @apiName GetOptimalRecommendation
   * @apiGroup Recommend
   * 
   * @apiDescription 외부 환경 조건을 입력받아 최적의 실내 환경을 추천합니다.
   * 입력받은 숫자값들을 자동으로 자연어 쿼리로 변환하여 추천봇에 전달합니다.
   * 
   * @apiHeader {String} X-API-Key API 인증 키 (필수)
   * 
   * @apiBody {Number} [external_temperature] 외부 온도 (°C, -50~60) - 선택사항
   * @apiBody {Number} [external_humidity] 외부 습도 (%, 0~100) - 선택사항
   * @apiBody {Number} [external_air_quality] 외부 공기질 (CO2 ppm, 0~10000) - 선택사항
   * @apiBody {String} [additional_request] 추가 요청 사항 (선택사항)
   * 
   * @apiSuccess {String} answer 추천 결과 답변
   * @apiSuccess {Number} processing_time 처리 시간(초)
   * @apiSuccess {Object} external_conditions 입력받은 외부 조건
   * @apiSuccess {String} generated_query 생성된 쿼리
   * 
   * @apiExample {curl} Example usage (모든 조건):
   *     curl -X POST http://localhost:3001/recommend/optimal \
   *          -H "Content-Type: application/json" \
   *          -H "X-API-Key: your-api-key" \
   *          -d '{
   *            "external_temperature": 30,
   *            "external_humidity": 70,
   *            "external_air_quality": 1400
   *          }'
   * 
   * @apiExample {curl} Example usage (온도와 공기질만):
   *     curl -X POST http://localhost:3001/recommend/optimal \
   *          -H "Content-Type: application/json" \
   *          -H "X-API-Key: your-api-key" \
   *          -d '{
   *            "external_temperature": 30,
   *            "external_air_quality": 1400
   *          }'
   * 
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "answer": "현재 실내온도 27도(외부 30도), 실내습도 58%(외부 70%), 실내CO2 720ppm 기준으로 최적온도는 24도, 최적습도는 48%, 최적CO2는 320ppm입니다",
   *       "processing_time": 3.45,
   *       "external_conditions": {
   *         "temperature": 30,
   *         "humidity": 70,
   *         "air_quality": 1400
   *       },
   *       "generated_query": "외부온도는 30도, 외부 습도는 70, 외부 공기질은 1400이야."
   *     }
   * 
   * @apiSuccessExample {json} Success-Response (부분 조건):
   *     HTTP/1.1 200 OK
   *     {
   *       "answer": "현재 실내온도 27도(외부 30도), 실내CO2 720ppm 기준으로 최적온도는 24도, 최적CO2는 320ppm입니다",
   *       "processing_time": 3.45,
   *       "external_conditions": {
   *         "temperature": 30,
   *         "air_quality": 1400
   *       },
   *       "generated_query": "외부온도는 30도, 외부 공기질은 1400이야."
   *     }
   */
  @UseGuards(ThrottlerGuard, ApiKeyGuard)
  @Post('optimal')
  @HttpCode(HttpStatus.OK)
  async getOptimalRecommendation(
    @Body(ValidationPipe) queryDto: RecommendQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RecommendResponseDto> {
    const result = await this.recommendService.getRecommendation(queryDto);
    
    // 추천 결과는 1분간 캐싱
    res.setHeader('Cache-Control', 'public, max-age=60');
    
    return result;
  }

  /**
   * @api {GET} /recommend/health 추천 시스템 상태 확인
   * @apiName RecommendHealth
   * @apiGroup Recommend
   * 
   * @apiDescription 파이썬 설치 상태와 추천봇 모듈의 동작 상태를 확인합니다.
   * 모니터링이나 헬스체크에 사용할 수 있습니다.
   * 
   * @apiSuccess {String} status 전체 상태 (healthy/error)
   * @apiSuccess {Boolean} python_available 파이썬 설치 여부
   * @apiSuccess {Boolean} recommend_module_available 추천봇 모듈 동작 여부
   * @apiSuccess {String} [error] 에러 메시지 (상태가 error인 경우)
   * 
   * @apiExample {curl} Example usage:
   *     curl -X GET http://localhost:3001/recommend/health
   * 
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "healthy",
   *       "python_available": true,
   *       "recommend_module_available": true
   *     }
   * 
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "error",
   *       "python_available": false,
   *       "recommend_module_available": false,
   *       "error": "Python is not available"
   *     }
   */
  @Get('health')
  async checkHealth(
    @Res({ passthrough: true }) res: Response,
  ): Promise<RecommendHealthDto> {
    const result = await this.recommendService.checkHealth();
    
    // 헬스체크는 캐싱하지 않음
    res.setHeader('Cache-Control', 'no-cache');
    
    return result;
  }
}