import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'uuid-token-received-by-email' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'newSecurePassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
