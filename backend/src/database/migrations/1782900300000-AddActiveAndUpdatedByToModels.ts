import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveAndUpdatedByToModels1782900300000 implements MigrationInterface {
  name = 'AddActiveAndUpdatedByToModels1782900300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "models" ADD COLUMN "updated_by" character varying`);
    await queryRunner.query(`ALTER TABLE "models" ADD COLUMN "active" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "models" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "models" DROP COLUMN "updated_by"`);
  }
}
