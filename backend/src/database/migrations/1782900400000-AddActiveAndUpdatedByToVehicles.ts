import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveAndUpdatedByToVehicles1782900400000 implements MigrationInterface {
  name = 'AddActiveAndUpdatedByToVehicles1782900400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN "updated_by" character varying`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN "active" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "updated_by"`);
  }
}
