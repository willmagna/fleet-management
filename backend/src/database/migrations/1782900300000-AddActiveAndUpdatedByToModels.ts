import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveAndUpdatedByToModels1782900300000 implements MigrationInterface {
  name = 'AddActiveAndUpdatedByToModels1782900300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [models] ADD [updated_by] NVARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE [models] ADD [active] BIT NOT NULL DEFAULT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [models] DROP COLUMN [active]`);
    await queryRunner.query(`ALTER TABLE [models] DROP COLUMN [updated_by]`);
  }
}
