import { Brand } from './brand.model';

export interface VehicleModel {
  id: number;
  name: string;
  brand: Brand;
  brandId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
}
