// AI 챗봇 모듈

import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module], // S3Service를 사용하기 위해 S3Module import
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService], // 다른 모듈에서 사용할 수 있도록 export
})
export class ChatbotModule {}