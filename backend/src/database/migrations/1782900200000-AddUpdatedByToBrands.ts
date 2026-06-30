import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedByToBrands1782900200000 implements MigrationInterface {
  name = 'AddUpdatedByToBrands1782900200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "brands" ADD COLUMN "updated_by" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "updated_by"`);
  }
}
