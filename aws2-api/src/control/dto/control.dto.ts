import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentControlDto {
  @IsNotEmpty({ message: '온도 값이 필요합니다.' })
  @IsNumber({}, { message: '온도는 숫자여야 합니다.' })
  @Min(-10, { message: '온도는 -10°C 이상이어야 합니다.' })
  @Max(50, { message: '온도는 50°C 이하여야 합니다.' })
  @Transform(({ value }) => parseFloat(value))
  temperature: number;

  @IsNotEmpty({ message: '습도 값이 필요합니다.' })
  @IsNumber({}, { message: '습도는 숫자여야 합니다.' })
  @Min(0, { message: '습도는 0% 이상이어야 합니다.' })
  @Max(100, { message: '습도는 100% 이하여야 합니다.' })
  @Transform(({ value }) => parseFloat(value))
  humidity: number;

  @IsNotEmpty({ message: '가스 농도 값이 필요합니다.' })
  @IsNumber({}, { message: '가스 농도는 숫자여야 합니다.' })
  @Min(0, { message: '가스 농도는 0ppm 이상이어야 합니다.' })
  @Max(2000, { message: '가스 농도는 2000ppm 이하여야 합니다.' })
  @Transform(({ value }) => parseFloat(value))
  gas: number;
}

export class ControlResponseDto {
  success: boolean;
  controlLogs: ControlLogSummaryDto[];
  iotMessagesSent: number;
}

export class ControlLogSummaryDto {
  id: string;
  sensor_type: string;
  result: string;
}