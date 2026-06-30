import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1782782118922 implements MigrationInterface {
  name = 'InitialSchema1782782118922';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE [brands] ([id] INT NOT NULL IDENTITY(1,1), [name] NVARCHAR(255) NOT NULL, [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(), [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(), [created_by] NVARCHAR(255) NOT NULL, CONSTRAINT [UQ_96db6bbbaa6f23cad26871339b6] UNIQUE ([name]), CONSTRAINT [PK_b0c437120b624da1034a81fc561] PRIMARY KEY ([id]))`,
    );
    await queryRunner.query(
      `CREATE TABLE [models] ([id] INT NOT NULL IDENTITY(1,1), [name] NVARCHAR(255) NOT NULL, [brand_id] INT NOT NULL, [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(), [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(), [created_by] NVARCHAR(255) NOT NULL, CONSTRAINT [PK_ef9ed7160ea69013636466bf2d5] PRIMARY KEY ([id]))`,
    );
    await queryRunner.query(
      `CREATE TABLE [vehicles] ([id] INT NOT NULL IDENTITY(1,1), [license_plate] NVARCHAR(255) NOT NULL, [chassis] NVARCHAR(255) NOT NULL, [renavam] NVARCHAR(255) NOT NULL, [year] INT NOT NULL, [model_id] INT NOT NULL, [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(), [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(), [created_by] NVARCHAR(255) NOT NULL, CONSTRAINT [UQ_7e9fab2e8625b63613f67bd706c] UNIQUE ([license_plate]), CONSTRAINT [UQ_7c6681b16862bd33fcf11984445] UNIQUE ([chassis]), CONSTRAINT [UQ_f20513b1dd64f0b2da6f91ef540] UNIQUE ([renavam]), CONSTRAINT [PK_18d8646b59304dce4af3a9e35b6] PRIMARY KEY ([id]))`,
    );
    await queryRunner.query(
      `ALTER TABLE [models] ADD CONSTRAINT [FK_f2b1673c6665816ff753e81d1a0] FOREIGN KEY ([brand_id]) REFERENCES [brands]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE [vehicles] ADD CONSTRAINT [FK_c4fe98a2147b08df1ab56df5313] FOREIGN KEY ([model_id]) REFERENCES [models]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE [vehicles] DROP CONSTRAINT [FK_c4fe98a2147b08df1ab56df5313]`);
    await queryRunner.query(`ALTER TABLE [models] DROP CONSTRAINT [FK_f2b1673c6665816ff753e81d1a0]`);
    await queryRunner.query(`DROP TABLE [vehicles]`);
    await queryRunner.query(`DROP TABLE [models]`);
    await queryRunner.query(`DROP TABLE [brands]`);
  }
}
