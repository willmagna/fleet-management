import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveToBrands1782900100000 implements MigrationInterface {
  name = 'AddActiveToBrands1782900100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [brands] ADD [active] BIT NOT NULL DEFAULT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [brands] DROP COLUMN [active]`);
  }
}
