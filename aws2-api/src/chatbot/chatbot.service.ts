// AI 챗봇 서비스 - 파이썬 스크립트 실행 관리

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import { ChatbotQueryDto, ChatbotResponseDto, ChatbotHealthDto } from './dto/chatbot.dto';
import { 
  ChatbotHistoryQueryDto, 
  ChatbotSessionsQueryDto,
  ChatbotHistoryResponseDto,
  ChatbotSessionsResponseDto,
  ChatbotTurnDto 
} from './dto/history.dto';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly pythonScriptPath: string;
  private readonly timeout = 60000; // 60초 타임아웃

  constructor(private readonly s3Service: S3Service) {
    // 파이썬 스크립트 경로 설정
    this.pythonScriptPath = join(process.cwd(), 'python-scripts', 'api_wrapper.py');
    this.logger.log(`Python script path: ${this.pythonScriptPath}`);
  }

  /**
   * 챗봇에 질문을 전송하고 답변을 받습니다
   */
  async askChatbot(queryDto: ChatbotQueryDto, sessionId: string): Promise<ChatbotResponseDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing query: ${queryDto.query.substring(0, 100)}...`);
      
      const result = await this.executePythonScript(queryDto.query, sessionId);
      
      const processingTime = (Date.now() - startTime) / 1000;
      this.logger.log(`Query processed in ${processingTime.toFixed(2)}s, mode: ${result.mode}`);
      
      return result;
      
    } catch (error) {
      this.logger.error('Failed to process chatbot query', error);
      throw new InternalServerErrorException('챗봇 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 챗봇 시스템 상태를 확인합니다
   */
  async checkHealth(): Promise<ChatbotHealthDto> {
    try {
      // 파이썬 설치 확인
      const pythonAvailable = await this.checkPythonAvailable();
      
      if (!pythonAvailable) {
        return {
          status: 'error',
          python_available: false,
          chatbot_module_available: false,
          error: 'Python is not available'
        };
      }

      // 챗봇 모듈 확인 (간단한 import 테스트)
      try {
        const result = await this.testPythonImport(); // 간단한 import 테스트
        return {
          status: 'healthy',
          python_available: true,
          chatbot_module_available: result
        };
      } catch (error) {
        return {
          status: 'error',
          python_available: true,
          chatbot_module_available: false,
          error: `Chatbot module error: ${error.message}`
        };
      }
      
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'error',
        python_available: false,
        chatbot_module_available: false,
        error: error.message
      };
    }
  }

  /**
   * 파이썬 스크립트를 실행하고 결과를 파싱합니다
   */
  private async executePythonScript(query: string, sessionId?: string, timeoutMs?: number): Promise<ChatbotResponseDto> {
    return new Promise((resolve, reject) => {
      const timeout = timeoutMs || this.timeout;
      
      // 파이썬 프로세스 시작 (JSON 입력으로 변경)
      const pythonProcess = spawn('python3', [this.pythonScriptPath], {
        cwd: join(process.cwd(), 'python-scripts'),
        env: {
          ...process.env,
          PYTHONPATH: join(process.cwd(), 'python-scripts')
        }
      });

      // JSON 입력으로 query와 session_id 전달
      const inputData = JSON.stringify({
        query: query,
        session_id: sessionId
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
          // 로그 메시지를 제외하고 JSON만 추출
          const lines = stdout.trim().split('\n');
          let jsonString = '';
          let foundStart = false;
          
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              foundStart = true;
            }
            if (foundStart) {
              jsonString += line + '\n';
            }
            if (foundStart && line.trim().endsWith('}')) {
              break;
            }
          }
          
          if (!jsonString.trim()) {
            throw new Error('No JSON found in output');
          }
          
          // JSON 파싱
          const result = JSON.parse(jsonString.trim());
          
          // 에러 응답 체크
          if (result.error) {
            this.logger.warn(`Python script returned error: ${result.error}`);
          }
          
          resolve(result as ChatbotResponseDto);
          
        } catch (parseError) {
          this.logger.error('Failed to parse Python script output', parseError);
          this.logger.error(`stdout: ${stdout}`);
          this.logger.error(`stderr: ${stderr}`);
          reject(new Error(`Failed to parse chatbot response: ${parseError.message}`));
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
        cwd: join(process.cwd(), 'python-scripts'),
        env: {
          ...process.env,
          PYTHONPATH: join(process.cwd(), 'python-scripts')
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

  /**
   * 특정 세션의 챗봇 히스토리를 S3에서 조회
   * 구조: chatlog-1293845/chatlogs/session_id.json
   */
  async getChatbotHistory(
    sessionId: string,
    queryDto: ChatbotHistoryQueryDto,
  ): Promise<ChatbotHistoryResponseDto> {
    try {
      this.logger.log(`Fetching chatbot history for session: ${sessionId}`);
      
      const sessionFileKey = `chatlogs/${sessionId}.json`;

      try {
        // 세션 파일 직접 읽기
        const fileData = await this.s3Service.getJson(sessionFileKey, 'chatlog-1293845');
        
        
        // 실제 파일 구조에 맞게 처리: history 배열을 포함한 세션 객체
        let turns: ChatbotTurnDto[] = [];
        
        if (fileData.history && Array.isArray(fileData.history)) {
          // history 배열에서 각 턴을 추출
          turns = fileData.history.map((turn, index) => ({
            session_id: sessionId,
            turn_id: index + 1, // history 배열의 인덱스 기반
            ts_kst: turn.ts_kst || turn.timestamp || fileData.last_saved || new Date().toISOString().replace('T', ' ').substring(0, 19),
            route: turn.route || 'general',
            query: turn.query || '',
            answer: turn.answer || '',
            docs: turn.docs || [],
            last_sensor_ctx: fileData.last_sensor_ctx || {},
            s3_key: sessionFileKey
          }));
        } else if (Array.isArray(fileData)) {
          // 배열인 경우 각 요소를 턴으로 처리 (기존 코드 유지)
          turns = fileData.map((turn, index) => ({
            session_id: sessionId,
            turn_id: turn.turn_id || index + 1,
            ts_kst: turn.ts_kst || turn.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            route: turn.route || 'general',
            query: turn.query || '',
            answer: turn.answer || '',
            docs: turn.docs || [],
            last_sensor_ctx: turn.last_sensor_ctx || {},
            s3_key: sessionFileKey
          }));
        } else {
          // 단일 객체인 경우 (기존 코드 유지)
          turns = [{
            session_id: sessionId,
            turn_id: fileData.turn_id || 1,
            ts_kst: fileData.ts_kst || fileData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            route: fileData.route || 'general',
            query: fileData.query || '',
            answer: fileData.answer || '',
            docs: fileData.docs || [],
            last_sensor_ctx: fileData.last_sensor_ctx || {},
            s3_key: sessionFileKey
          }];
        }

        // 날짜 필터링
        if (queryDto.startDate || queryDto.endDate) {
          turns = turns.filter(turn => {
            const turnDate = turn.ts_kst.split(' ')[0];
            if (queryDto.startDate && turnDate < queryDto.startDate) return false;
            if (queryDto.endDate && turnDate > queryDto.endDate) return false;
            return true;
          });
        }

        // limit 적용
        const limit = queryDto.limit || 20;
        turns = turns.slice(0, limit);

        // 날짜 범위 계산
        const dates = turns.map(turn => turn.ts_kst.split(' ')[0]);
        const startDate = dates.length > 0 ? dates.sort()[0] : new Date().toISOString().split('T')[0];
        const endDate = dates.length > 0 ? dates.sort().reverse()[0] : new Date().toISOString().split('T')[0];

        return {
          session_id: sessionId,
          total_turns: turns.length,
          turns,
          start_date: startDate,
          end_date: endDate
        };

      } catch (error) {
        // 파일이 존재하지 않는 경우
        this.logger.warn(`Session file not found: ${sessionFileKey}`);
        return {
          session_id: sessionId,
          total_turns: 0,
          turns: [],
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        };
      }

    } catch (error) {
      this.logger.error(`Failed to fetch chatbot history for session ${sessionId}:`, error);
      throw new InternalServerErrorException('챗봇 히스토리 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 챗봇 세션 목록을 S3에서 조회
   * 구조: chatlog-1293845/chatlogs/session_id.json
   */
  async getChatbotSessions(queryDto: ChatbotSessionsQueryDto): Promise<ChatbotSessionsResponseDto> {
    try {
      this.logger.log('Fetching chatbot sessions list');
      
      const prefix = 'chatlogs/';
      const limit = queryDto.limit || 20;

      // S3에서 모든 chatlog-1293845/chatlogs 파일들 검색
      const s3Client = (this.s3Service as any).s3;
      const bucketName = 'chatlog-1293845'; // 챗봇 전용 버킷

      const listCommand = {
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000 // 세션들을 찾기 위해 충분히 많이 가져오기
      };

      const response = await s3Client.send(
        new (await import('@aws-sdk/client-s3')).ListObjectsV2Command(listCommand)
      );

      const objects = response.Contents || [];
      const sessions: any[] = [];

      for (const obj of objects) {
        if (!obj.Key || !obj.Key.endsWith('.json')) continue;
        
        // chatlogs/session_id.json 패턴에서 session_id 추출
        const pathParts = obj.Key.split('/');
        if (pathParts.length < 2) continue; // chatlogs/session_id.json
        
        const fileName = pathParts[1]; // session_id.json
        const sessionId = fileName.replace('.json', '');
        if (!sessionId) continue;

        try {
          // 세션 파일에서 데이터 읽기
          const fileData = await this.s3Service.getJson(obj.Key, 'chatlog-1293845');
          
          let firstTurnDate = '';
          let lastTurnDate = '';
          let totalTurns = 0;
          let lastQuery = '';
          let lastAnswer = '';

          if (Array.isArray(fileData)) {
            // 배열인 경우
            totalTurns = fileData.length;
            if (fileData.length > 0) {
              const firstTurn = fileData[0];
              const lastTurn = fileData[fileData.length - 1];
              
              firstTurnDate = firstTurn.ts_kst || firstTurn.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
              lastTurnDate = lastTurn.ts_kst || lastTurn.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
              lastQuery = lastTurn.query || '';
              lastAnswer = lastTurn.answer || '';
            }
          } else {
            // 객체인 경우 (단일 턴)
            totalTurns = 1;
            firstTurnDate = lastTurnDate = fileData.ts_kst || fileData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
            lastQuery = fileData.query || '';
            lastAnswer = fileData.answer || '';
          }

          // 날짜 필터링 체크
          if (queryDto.startDate || queryDto.endDate) {
            const sessionDate = lastTurnDate.split(' ')[0];
            if (queryDto.startDate && sessionDate < queryDto.startDate) continue;
            if (queryDto.endDate && sessionDate > queryDto.endDate) continue;
          }

          sessions.push({
            session_id: sessionId,
            first_turn_date: firstTurnDate,
            last_turn_date: lastTurnDate,
            total_turns: totalTurns,
            last_query: lastQuery,
            last_answer: lastAnswer
          });

        } catch (error) {
          this.logger.warn(`Failed to process session file ${obj.Key}:`, error);
        }
      }

      // 최신순으로 정렬하고 제한
      const sortedSessions = sessions
        .sort((a, b) => new Date(b.last_turn_date).getTime() - new Date(a.last_turn_date).getTime())
        .slice(0, limit);

      return {
        total_sessions: sortedSessions.length,
        sessions: sortedSessions
      };

    } catch (error) {
      this.logger.error('Failed to fetch chatbot sessions:', error);
      throw new InternalServerErrorException('챗봇 세션 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 날짜별 챗봇 히스토리를 S3에서 조회
   * 구조: chatlog-1293845/chatlogs/session_id.json
   */
  async getChatbotHistoryByDate(date: string, limit: number): Promise<ChatbotHistoryResponseDto[]> {
    try {
      this.logger.log(`Fetching chatbot history for date: ${date}`);
      
      // 날짜 형식 검증
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }

      const prefix = 'chatlogs/';
      const targetDate = date;

      // S3에서 모든 chatlog-1293845/chatlogs 파일들 검색
      const s3Client = (this.s3Service as any).s3;
      const bucketName = 'chatlog-1293845'; // 챗봇 전용 버킷

      const listCommand = {
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000
      };

      const response = await s3Client.send(
        new (await import('@aws-sdk/client-s3')).ListObjectsV2Command(listCommand)
      );

      const objects = response.Contents || [];
      const sessionsData: any[] = [];

      for (const obj of objects) {
        if (!obj.Key || !obj.Key.endsWith('.json')) continue;
        
        // chatlogs/session_id.json 패턴에서 session_id 추출
        const pathParts = obj.Key.split('/');
        if (pathParts.length < 2) continue; // chatlogs/session_id.json
        
        const fileName = pathParts[1]; // session_id.json
        const sessionId = fileName.replace('.json', '');
        if (!sessionId) continue;

        try {
          // 세션 파일에서 데이터 읽기
          const fileData = await this.s3Service.getJson(obj.Key, 'chatlog-1293845');
          const turns: ChatbotTurnDto[] = [];
          let hasMatchingDate = false;

          if (Array.isArray(fileData)) {
            // 배열인 경우 각 턴을 확인
            for (let i = 0; i < fileData.length && turns.length < limit; i++) {
              const turn = fileData[i];
              const timestamp = turn.ts_kst || turn.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
              const turnDate = timestamp.split(' ')[0];
              
              if (turnDate === targetDate) {
                hasMatchingDate = true;
                turns.push({
                  session_id: sessionId,
                  turn_id: turn.turn_id || i + 1,
                  ts_kst: timestamp,
                  route: turn.route || 'general',
                  query: turn.query || '',
                  answer: turn.answer || '',
                  docs: turn.docs || [],
                  last_sensor_ctx: turn.last_sensor_ctx || {},
                  s3_key: obj.Key
                });
              }
            }
          } else {
            // 객체인 경우 (단일 턴)
            const timestamp = fileData.ts_kst || fileData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
            const turnDate = timestamp.split(' ')[0];
            
            if (turnDate === targetDate) {
              hasMatchingDate = true;
              turns.push({
                session_id: sessionId,
                turn_id: fileData.turn_id || 1,
                ts_kst: timestamp,
                route: fileData.route || 'general',
                query: fileData.query || '',
                answer: fileData.answer || '',
                docs: fileData.docs || [],
                last_sensor_ctx: fileData.last_sensor_ctx || {},
                s3_key: obj.Key
              });
            }
          }

          if (hasMatchingDate && turns.length > 0) {
            sessionsData.push({
              session_id: sessionId,
              total_turns: turns.length,
              turns,
              start_date: targetDate,
              end_date: targetDate
            });
          }

        } catch (error) {
          this.logger.warn(`Failed to process session file ${obj.Key} for date ${date}:`, error);
        }
      }

      return sessionsData.slice(0, Math.ceil(limit / 10)); // 세션 수 제한

    } catch (error) {
      this.logger.error(`Failed to fetch chatbot history for date ${date}:`, error);
      throw new InternalServerErrorException('날짜별 챗봇 히스토리 조회 중 오류가 발생했습니다.');
    }
  }
}