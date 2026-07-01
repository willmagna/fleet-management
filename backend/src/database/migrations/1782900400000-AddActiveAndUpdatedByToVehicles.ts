import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveAndUpdatedByToVehicles1782900400000 implements MigrationInterface {
  name = 'AddActiveAndUpdatedByToVehicles1782900400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [vehicles] ADD [updated_by] NVARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE [vehicles] ADD [active] BIT NOT NULL DEFAULT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [vehicles] DROP COLUMN [active]`);
    await queryRunner.query(`ALTER TABLE [vehicles] DROP COLUMN [updated_by]`);
  }
}
