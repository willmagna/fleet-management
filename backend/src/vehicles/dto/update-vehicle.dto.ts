import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(17)
  chassis?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  renavam?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  modelId?: number;
}
