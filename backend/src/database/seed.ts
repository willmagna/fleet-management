import 'dotenv/config';
import { join } from 'path';
import { readFileSync } from 'fs';
import { hash } from 'bcryptjs';
import AppDataSource from './data-source';
import { Brand } from '../brands/brand.entity';
import { Model } from '../models/model.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { User } from '../users/user.entity';

interface SeedUser {
  id: number;
  nickname: string;
  name: string;
  email: string;
  password: string;
}

interface SeedBrand {
  id: number;
  name: string;
  created_by: string;
}

interface SeedModel {
  id: number;
  name: string;
  brand_id: number;
  created_by: string;
}

interface SeedVehicle {
  id: number;
  license_plate: string;
  chassis: string;
  renavam: string;
  year: number;
  model_id: number;
  created_by: string;
}

interface SeedData {
  brands: SeedBrand[];
  models: SeedModel[];
  vehicles: SeedVehicle[];
}

async function insertIgnore<T extends object>(
  dataSource: import('typeorm').DataSource,
  repo: import('typeorm').Repository<T>,
  table: string,
  values: Partial<T>,
): Promise<void> {
  await dataSource.query(`SET IDENTITY_INSERT [${table}] ON`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await repo.createQueryBuilder().insert().values(values as any).execute();
  } catch (err: unknown) {
    const sqlErr = err as { number?: number };
    if (sqlErr.number !== 2627 && sqlErr.number !== 2601) throw err;
  } finally {
    await dataSource.query(`SET IDENTITY_INSERT [${table}] OFF`);
  }
}

async function seed() {
  const dataSource = await AppDataSource.initialize();

  const rawUsers = readFileSync(
    join(__dirname, './seeds_data/seed_users.json'),
    'utf-8',
  );
  const users = (JSON.parse(rawUsers) as { users: SeedUser[] }).users;

  const raw = readFileSync(
    join(__dirname, './seeds_data/seed_vehicles.json'),
    'utf-8',
  );
  const data = JSON.parse(raw) as SeedData;

  const userRepo = dataSource.getRepository(User);
  const brandRepo = dataSource.getRepository(Brand);
  const modelRepo = dataSource.getRepository(Model);
  const vehicleRepo = dataSource.getRepository(Vehicle);

  for (const u of users) {
    const passwordHash = await hash(u.password, 10);
    await insertIgnore(dataSource, userRepo, 'users', {
      id: u.id,
      nickname: u.nickname,
      name: u.name,
      email: u.email,
      password: passwordHash,
    } as Partial<User>);
  }
  console.log(`Seeded ${users.length} users`);

  for (const b of data.brands) {
    await insertIgnore(dataSource, brandRepo, 'brands', {
      id: b.id,
      name: b.name,
      createdBy: b.created_by,
    } as Partial<Brand>);
  }
  console.log(`Seeded ${data.brands.length} brands`);

  for (const m of data.models) {
    await insertIgnore(dataSource, modelRepo, 'models', {
      id: m.id,
      name: m.name,
      brandId: m.brand_id,
      createdBy: m.created_by,
    } as Partial<Model>);
  }
  console.log(`Seeded ${data.models.length} models`);

  for (const v of data.vehicles) {
    await insertIgnore(dataSource, vehicleRepo, 'vehicles', {
      id: v.id,
      licensePlate: v.license_plate,
      chassis: v.chassis,
      renavam: v.renavam,
      year: v.year,
      modelId: v.model_id,
      createdBy: v.created_by,
    } as Partial<Vehicle>);
  }
  console.log(`Seeded ${data.vehicles.length} vehicles`);

  await dataSource.query(`DBCC CHECKIDENT ('[users]', RESEED)`);
  await dataSource.query(`DBCC CHECKIDENT ('[brands]', RESEED)`);
  await dataSource.query(`DBCC CHECKIDENT ('[models]', RESEED)`);
  await dataSource.query(`DBCC CHECKIDENT ('[vehicles]', RESEED)`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
