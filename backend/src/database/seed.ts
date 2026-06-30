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
    await userRepo
      .createQueryBuilder()
      .insert()
      .values({
        id: u.id,
        nickname: u.nickname,
        name: u.name,
        email: u.email,
        password: passwordHash,
      })
      .orIgnore()
      .execute();
  }
  console.log(`Seeded ${users.length} users`);

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
      .values({
        id: m.id,
        name: m.name,
        brandId: m.brand_id,
        createdBy: m.created_by,
      })
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

  await dataSource.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), MAX(id)) FROM users`);
  await dataSource.query(`SELECT setval(pg_get_serial_sequence('brands', 'id'), MAX(id)) FROM brands`);
  await dataSource.query(`SELECT setval(pg_get_serial_sequence('models', 'id'), MAX(id)) FROM models`);
  await dataSource.query(`SELECT setval(pg_get_serial_sequence('vehicles', 'id'), MAX(id)) FROM vehicles`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
