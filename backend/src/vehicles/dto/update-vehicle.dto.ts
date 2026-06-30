import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'XYZ-9999', maxLength: 20 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  licensePlate?: string;

  @ApiPropertyOptional({ example: '9BWZZZ377VT004251', maxLength: 17 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(17)
  chassis?: string;

  @ApiPropertyOptional({ example: '12345678901', maxLength: 11 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  renavam?: string;

  @ApiPropertyOptional({ example: 2024, minimum: 1900 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiPropertyOptional({ example: 3, description: 'ID of the model' })
  @IsOptional()
  @IsInt()
  @Min(1)
  modelId?: number;
}
