import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateModelDto {
  @ApiProperty({ example: 'Corolla', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 1, description: 'ID of the brand' })
  @IsInt()
  @Min(1)
  brandId: number;
}
