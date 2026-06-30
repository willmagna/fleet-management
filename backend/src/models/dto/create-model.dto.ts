import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsInt()
  @Min(1)
  brandId: number;
}
