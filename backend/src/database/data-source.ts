import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
});
