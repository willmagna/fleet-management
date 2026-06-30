import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  licensePlate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(17)
  chassis: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  renavam: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsInt()
  @Min(1)
  modelId: number;
}
