import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const VEHICLE_STATUSES = [
  'disponivel',
  'alugado',
  'manutencao',
  'inativo',
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export class ChangeStatusDto {
  @IsIn(VEHICLE_STATUSES)
  status: VehicleStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
