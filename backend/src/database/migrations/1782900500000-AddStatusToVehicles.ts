import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToVehicles1782900500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE [vehicles] ADD [status] NVARCHAR(50) NOT NULL DEFAULT 'disponivel'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [vehicles] DROP COLUMN [status]`);
  }
}
