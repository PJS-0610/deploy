// 환경 제어 API 컨트롤러

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ControlService } from './control.service';
import { EnvironmentControlDto } from './dto/control.dto';

@Controller('control')
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  /**
   * @api {POST} /control/environment 환경 설정값 제어
   * @apiName ControlEnvironment
   * @apiGroup Control
   * 
   * @apiDescription 온도, 습도, 가스 농도 설정값을 받아서 제어 명령을 처리합니다.
   * 각 센서별로 제어 로그를 DynamoDB에 저장하고, AWS IoT Core로 명령을 전송합니다.
   * 
   * @apiBody {Number} temperature 온도 설정값 (°C)
   * @apiBody {Number} humidity 습도 설정값 (%)
   * @apiBody {Number} gas 가스 농도 설정값 (ppm)
   * 
   * @apiSuccess {Boolean} success 성공 여부
   * @apiSuccess {Object[]} controlLogs 제어 로그 배열
   * @apiSuccess {String} controlLogs.id 제어 로그 ID
   * @apiSuccess {String} controlLogs.sensor_type 센서 타입
   * @apiSuccess {String} controlLogs.result 제어 결과
   * @apiSuccess {Number} iotMessagesSent IoT로 전송된 메시지 수
   * 
   * @apiExample {curl} Example usage:
   *     curl -X POST https://aws2aws2.com/control/environment \
   *       -H "X-API-Key: your-api-key" \
   *       -H "Content-Type: application/json" \
   *       -d '{"temperature": 24, "humidity": 50, "gas": 300}'
   * 
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "controlLogs": [
   *         {"id": "0000001", "sensor_type": "temp", "result": "OK"},
   *         {"id": "0000002", "sensor_type": "humidity", "result": "OK"},
   *         {"id": "0000003", "sensor_type": "gas", "result": "OK"}
   *       ],
   *       "iotMessagesSent": 3
   *     }
   */
  @UseGuards(ThrottlerGuard, ApiKeyGuard)
  @Post('environment')
  @HttpCode(HttpStatus.OK)
  async controlEnvironment(
    @Body(ValidationPipe) controlDto: EnvironmentControlDto,
  ) {
    return await this.controlService.processEnvironmentControl(controlDto);
  }
}