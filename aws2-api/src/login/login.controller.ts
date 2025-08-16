import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LoginService } from './login.service';
import { CreateCodeDto, UpdateCodeDto } from './dto/code.dto';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  /**
   * 입장코드 검증 API
   * @param code - 입장코드 (ex: 3251)
   * @returns {boolean} - 코드 일치 여부
   */
  @Get('code/:code')
  async validateCode(@Param('code') code: string): Promise<{ success: boolean }> {
    const isValid = await this.loginService.validateCode(code);
    return { success: isValid };
  }

  /**
   * 모든 코드 조회 (관리자용)
   */
  @Get('codes')
  async getAllCodes() {
    return await this.loginService.getAllCodes();
  }

  /**
   * 새 코드 생성
   */
  @Post('codes')
  async createCode(@Body() createCodeDto: CreateCodeDto) {
    return await this.loginService.createCode(createCodeDto);
  }

  /**
   * 코드 수정
   */
  @Put('codes/:id')
  async updateCode(@Param('id') id: string, @Body() updateCodeDto: UpdateCodeDto) {
    return await this.loginService.updateCode(id, updateCodeDto);
  }

  /**
   * 코드 삭제
   */
  @Delete('codes/:id')
  async deleteCode(@Param('id') id: string) {
    return await this.loginService.deleteCode(id);
  }
}