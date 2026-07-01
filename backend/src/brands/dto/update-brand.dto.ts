import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBrandDto {
  @ApiPropertyOptional({ example: 'Honda', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;
}
