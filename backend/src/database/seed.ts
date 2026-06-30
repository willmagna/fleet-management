import 'dotenv/config';
import { join } from 'path';
import { readFileSync } from 'fs';
import AppDataSource from './data-source';
import { Brand } from '../brands/brand.entity';
import { Model } from '../models/model.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

interface SeedBrand {
  id: string;
  name: string;
  created_by: string;
}

interface SeedModel {
  id: string;
  name: string;
  brand_id: string;
  created_by: string;
}

interface SeedVehicle {
  id: string;
  license_plate: string;
  chassis: string;
  renavam: string;
  year: number;
  model_id: string;
  created_by: string;
}

interface SeedData {
  brands: SeedBrand[];
  models: SeedModel[];
  vehicles: SeedVehicle[];
}

async function seed() {
  const dataSource = await AppDataSource.initialize();

  const raw = readFileSync(join(__dirname, '../../seed_vehicles.json'), 'utf-8');
  const data: SeedData = JSON.parse(raw);

  const brandRepo = dataSource.getRepository(Brand);
  const modelRepo = dataSource.getRepository(Model);
  const vehicleRepo = dataSource.getRepository(Vehicle);

  for (const b of data.brands) {
    await brandRepo
      .createQueryBuilder()
      .insert()
      .values({ id: b.id, name: b.name, createdBy: b.created_by })
      .orIgnore()
      .execute();
  }
  console.log(`Seeded ${data.brands.length} brands`);

  for (const m of data.models) {
    await modelRepo
      .createQueryBuilder()
      .insert()
      .values({ id: m.id, name: m.name, brandId: m.brand_id, createdBy: m.created_by })
      .orIgnore()
      .execute();
  }
  console.log(`Seeded ${data.models.length} models`);

  for (const v of data.vehicles) {
    await vehicleRepo
      .createQueryBuilder()
      .insert()
      .values({
        id: v.id,
        licensePlate: v.license_plate,
        chassis: v.chassis,
        renavam: v.renavam,
        year: v.year,
        modelId: v.model_id,
        createdBy: v.created_by,
      })
      .orIgnore()
      .execute();
  }
  console.log(`Seeded ${data.vehicles.length} vehicles`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
