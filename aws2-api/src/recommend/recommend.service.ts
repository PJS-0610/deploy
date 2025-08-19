// 환경 추천 서비스 - 파이썬 추천봇 실행 관리

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import { RecommendQueryDto, RecommendResponseDto, RecommendHealthDto } from './dto/recommend.dto';

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);
  private readonly pythonScriptPath: string;
  private readonly timeout = 60000; // 60초 타임아웃

  constructor() {
    // 파이썬 wrapper 스크립트 경로 설정
    this.pythonScriptPath = join(process.cwd(), 'recommend-bot-python', 'api_wrapper.py');
    this.logger.log(`Recommend Python script path: ${this.pythonScriptPath}`);
  }

  /**
   * 환경 추천 요청 처리
   */
  async getRecommendation(queryDto: RecommendQueryDto): Promise<RecommendResponseDto> {
    const startTime = Date.now();
    
    try {
      // 숫자 파라미터를 한국어 쿼리로 변환
      const generatedQuery = this.buildQuery(
        queryDto.external_temperature,
        queryDto.external_humidity,
        queryDto.external_air_quality,
        queryDto.additional_request
      );
      
      this.logger.log(`Generated query: ${generatedQuery}`);
      
      const result = await this.executePythonScript(generatedQuery);
      
      const processingTime = (Date.now() - startTime) / 1000;
      this.logger.log(`Recommendation processed in ${processingTime.toFixed(2)}s`);
      
      return {
        answer: result,
        processing_time: processingTime,
        external_conditions: {
          ...(queryDto.external_temperature !== undefined && { temperature: queryDto.external_temperature }),
          ...(queryDto.external_humidity !== undefined && { humidity: queryDto.external_humidity }),
          ...(queryDto.external_air_quality !== undefined && { air_quality: queryDto.external_air_quality })
        },
        generated_query: generatedQuery
      };
      
    } catch (error) {
      this.logger.error('Failed to process recommendation query', error);
      throw new InternalServerErrorException('환경 추천 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 추천봇 시스템 상태 확인
   */
  async checkHealth(): Promise<RecommendHealthDto> {
    try {
      // 파이썬 설치 확인
      const pythonAvailable = await this.checkPythonAvailable();
      
      if (!pythonAvailable) {
        return {
          status: 'error',
          python_available: false,
          recommend_module_available: false,
          error: 'Python is not available'
        };
      }

      // 추천봇 모듈 확인 (간단한 import 테스트)
      try {
        const result = await this.testPythonImport();
        return {
          status: 'healthy',
          python_available: true,
          recommend_module_available: result
        };
      } catch (error) {
        return {
          status: 'error',
          python_available: true,
          recommend_module_available: false,
          error: `Recommend module error: ${error.message}`
        };
      }
      
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'error',
        python_available: false,
        recommend_module_available: false,
        error: error.message
      };
    }
  }

  /**
   * 숫자 파라미터를 한국어 쿼리로 변환 (입력이 없는 값은 제외)
   */
  private buildQuery(
    temperature?: number,
    humidity?: number,
    airQuality?: number,
    additionalRequest?: string
  ): string {
    const conditions: string[] = [];
    
    if (temperature !== undefined && temperature !== null) {
      conditions.push(`외부온도는 ${temperature}도`);
    }
    
    if (humidity !== undefined && humidity !== null) {
      conditions.push(`외부 습도는 ${humidity}`);
    }
    
    if (airQuality !== undefined && airQuality !== null) {
      conditions.push(`외부 공기질은 ${airQuality}이야`);
    }
    
    // 최소 하나의 조건은 있어야 함
    if (conditions.length === 0) {
      throw new Error('최소 하나의 외부 환경 조건을 입력해야 합니다.');
    }
    
    let query = conditions.join(', ') + '.';
    
    if (additionalRequest) {
      query += ` ${additionalRequest}`;
    }
    
    return query;
  }

  /**
   * 파이썬 스크립트를 실행하고 결과를 파싱
   */
  private async executePythonScript(query: string, timeoutMs?: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = timeoutMs || this.timeout;
      
      // 파이썬 프로세스 시작 (JSON 입력으로 변경)
      const pythonProcess = spawn('python3', [this.pythonScriptPath], {
        cwd: join(process.cwd(), 'recommend-bot-python'),
        env: {
          ...process.env,
          PYTHONPATH: join(process.cwd(), 'recommend-bot-python')
        }
      });

      // JSON 입력으로 query 전달
      const inputData = JSON.stringify({
        query: query
      });
      pythonProcess.stdin.write(inputData);
      pythonProcess.stdin.end();

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      // 타임아웃 설정
      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          pythonProcess.kill('SIGTERM');
          reject(new Error(`Python script timed out after ${timeout}ms`));
        }
      }, timeout);

      // stdout 데이터 수집
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // stderr 데이터 수집
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // 프로세스 종료 처리
      pythonProcess.on('close', (code) => {
        clearTimeout(timer);
        
        if (isResolved) return;
        isResolved = true;

        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}`);
          this.logger.error(`stderr: ${stderr}`);
          reject(new Error(`Python script failed with exit code ${code}: ${stderr}`));
          return;
        }

        try {
          // JSON 응답 파싱
          const result = JSON.parse(stdout.trim());
          
          // 에러 응답 체크
          if (result.error || result.status === 'error') {
            this.logger.warn(`Python script returned error: ${result.error}`);
            resolve(result.answer || result.error || '알 수 없는 오류가 발생했습니다.');
          } else {
            resolve(result.answer || result.response || '추천 결과를 받았지만 내용이 없습니다.');
          }
          
        } catch (parseError) {
          this.logger.error('Failed to parse Python script output', parseError);
          this.logger.error(`stdout: ${stdout}`);
          this.logger.error(`stderr: ${stderr}`);
          reject(new Error(`Failed to parse recommend response: ${parseError.message}`));
        }
      });

      // 프로세스 에러 처리
      pythonProcess.on('error', (error) => {
        clearTimeout(timer);
        
        if (!isResolved) {
          isResolved = true;
          this.logger.error('Failed to start Python script', error);
          reject(new Error(`Failed to start Python process: ${error.message}`));
        }
      });
    });
  }

  /**
   * 파이썬 설치 확인
   */
  private async checkPythonAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', ['--version']);
      
      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });
      
      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * 파이썬 모듈 import 테스트 (빠른 헬스체크용)
   */
  private async testPythonImport(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', ['-c', 'import boto3, json; print("OK")'], {
        cwd: join(process.cwd(), 'recommend-bot-python'),
        env: {
          ...process.env,
          PYTHONPATH: join(process.cwd(), 'recommend-bot-python')
        }
      });

      let stdout = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.on('close', (code) => {
        resolve(code === 0 && stdout.trim() === 'OK');
      });

      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }
}