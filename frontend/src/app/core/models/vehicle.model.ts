import { VehicleModel } from './model.model';

export type VehicleStatus = 'disponivel' | 'alugado' | 'manutencao' | 'inativo';

export interface Vehicle {
  id: number;
  licensePlate: string;
  chassis: string;
  renavam: string;
  year: number;
  model: VehicleModel;
  modelId: number;
  status: VehicleStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
}

export interface CreateVehicleDto {
  licensePlate: string;
  chassis: string;
  renavam: string;
  year: number;
  modelId: number;
}

export interface UpdateVehicleDto {
  licensePlate?: string;
  chassis?: string;
  renavam?: string;
  year?: number;
  modelId?: number;
}

export interface ChangeStatusDto {
  status: VehicleStatus;
  notes?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  disponivel: 'Disponível',
  alugado: 'Alugado',
  manutencao: 'Manutenção',
  inativo: 'Inativo',
};
