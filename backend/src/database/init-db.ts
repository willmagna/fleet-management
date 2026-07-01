import 'dotenv/config';
import { DataSource } from 'typeorm';

async function initDb() {
  const dbName = process.env.DB_NAME!;

  const master = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: 'master',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    options: { encrypt: false, trustServerCertificate: true },
    entities: [],
    migrations: [],
    synchronize: false,
  });

  await master.initialize();
  await master.query(
    `IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'${dbName}') CREATE DATABASE [${dbName}]`,
  );
  await master.destroy();

  console.log(`Database '${dbName}' is ready.`);
}

initDb().catch((err) => {
  console.error('init-db failed:', err);
  process.exit(1);
});
