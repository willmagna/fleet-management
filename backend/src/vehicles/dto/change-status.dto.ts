import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const VEHICLE_STATUSES = [
  'disponivel',
  'alugado',
  'manutencao',
  'inativo',
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export class ChangeStatusDto {
  @ApiProperty({ enum: VEHICLE_STATUSES, example: 'alugado' })
  @IsIn(VEHICLE_STATUSES)
  status: VehicleStatus;

  @ApiPropertyOptional({ example: 'Contrato 001', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
