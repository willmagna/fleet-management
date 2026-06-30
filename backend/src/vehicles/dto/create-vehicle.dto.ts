import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC-1234', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  licensePlate: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', maxLength: 17 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(17)
  chassis: string;

  @ApiProperty({ example: '12345678901', maxLength: 11 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  renavam: string;

  @ApiProperty({ example: 2022, minimum: 1900 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 1, description: 'ID of the model' })
  @IsInt()
  @Min(1)
  modelId: number;
}
