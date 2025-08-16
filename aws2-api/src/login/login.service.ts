import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { DynamoDBCodeDatabase, CodeEntity } from './entities/dynamodb-code.entity';
import { CreateCodeDto, UpdateCodeDto } from './dto/code.dto';

@Injectable()
export class LoginService implements OnModuleInit {
  private readonly codeDatabase = new DynamoDBCodeDatabase();

  async onModuleInit() {
    // 서비스 시작 시 초기 데이터 삽입
    try {
      await this.codeDatabase.seedData();
      console.log('DynamoDB 초기 데이터 설정 완료');
    } catch (error) {
      console.error('DynamoDB 초기 데이터 설정 실패:', error);
    }
  }

  /**
   * 입장코드 검증
   * @param code - 검증할 코드
   * @returns {boolean} - 유효한 코드인지 여부
   */
  async validateCode(code: string): Promise<boolean> {
    const foundCode = await this.codeDatabase.findByCode(code);
    return foundCode !== null;
  }

  /**
   * 모든 코드 조회
   * @returns {CodeEntity[]} - 모든 코드 목록
   */
  async getAllCodes(): Promise<CodeEntity[]> {
    return await this.codeDatabase.findAll();
  }

  /**
   * 새 코드 생성
   * @param createCodeDto - 생성할 코드 정보
   * @returns {CodeEntity} - 생성된 코드
   */
  async createCode(createCodeDto: CreateCodeDto): Promise<CodeEntity> {
    // 중복 코드 체크
    const existingCode = await this.codeDatabase.findByCode(createCodeDto.code);
    if (existingCode) {
      throw new ConflictException(`코드 '${createCodeDto.code}'는 이미 존재합니다.`);
    }

    const codeData = {
      code: createCodeDto.code,
      description: createCodeDto.description || '',
      isActive: createCodeDto.isActive ?? true,
      expiresAt: createCodeDto.expiresAt ? new Date(createCodeDto.expiresAt).toISOString() : undefined,
    };

    return await this.codeDatabase.create(codeData);
  }

  /**
   * 코드 수정
   * @param id - 코드 ID
   * @param updateCodeDto - 수정할 코드 정보
   * @returns {CodeEntity} - 수정된 코드
   */
  async updateCode(id: string, updateCodeDto: UpdateCodeDto): Promise<CodeEntity> {
    const existingCode = await this.codeDatabase.findById(id);
    if (!existingCode) {
      throw new NotFoundException(`ID ${id}인 코드를 찾을 수 없습니다.`);
    }

    // 코드 중복 체크 (다른 ID의 코드와 중복되는지)
    if (updateCodeDto.code) {
      const duplicateCode = await this.codeDatabase.findByCode(updateCodeDto.code);
      if (duplicateCode && duplicateCode.id !== id) {
        throw new ConflictException(`코드 '${updateCodeDto.code}'는 이미 존재합니다.`);
      }
    }

    const updateData = {
      ...updateCodeDto,
      expiresAt: updateCodeDto.expiresAt ? new Date(updateCodeDto.expiresAt).toISOString() : undefined,
    };

    const updatedCode = await this.codeDatabase.update(id, updateData);
    if (!updatedCode) {
      throw new NotFoundException(`ID ${id}인 코드를 찾을 수 없습니다.`);
    }

    return updatedCode;
  }

  /**
   * 코드 삭제
   * @param id - 코드 ID
   * @returns {object} - 삭제 결과
   */
  async deleteCode(id: string): Promise<{ message: string }> {
    const deleted = await this.codeDatabase.delete(id);
    if (!deleted) {
      throw new NotFoundException(`ID ${id}인 코드를 찾을 수 없습니다.`);
    }

    return { message: `ID ${id}인 코드가 삭제되었습니다.` };
  }
}