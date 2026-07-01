import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateModelDto {
  @ApiPropertyOptional({ example: 'Civic', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 2, description: 'ID of the brand' })
  @IsOptional()
  @IsInt()
  @Min(1)
  brandId?: number;
}
