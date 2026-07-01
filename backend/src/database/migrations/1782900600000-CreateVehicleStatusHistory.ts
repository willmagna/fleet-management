import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleStatusHistory1782900600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [vehicle_status_history] (
        [id]          INT NOT NULL IDENTITY(1,1),
        [vehicle_id]  INT NOT NULL,
        [from_status] NVARCHAR(50) NULL,
        [to_status]   NVARCHAR(50) NOT NULL,
        [changed_by]  NVARCHAR(255) NOT NULL,
        [changed_at]  DATETIME2 NOT NULL DEFAULT GETDATE(),
        [notes]       NVARCHAR(500) NULL,
        CONSTRAINT [PK_vehicle_status_history] PRIMARY KEY ([id]),
        CONSTRAINT [FK_vehicle_status_history_vehicle]
          FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE [vehicle_status_history]`);
  }
}
