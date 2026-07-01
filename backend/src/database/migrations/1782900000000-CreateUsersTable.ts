import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1782900000000 implements MigrationInterface {
  name = 'CreateUsersTable1782900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE [users] ([id] INT NOT NULL IDENTITY(1,1), [nickname] NVARCHAR(255) NOT NULL, [name] NVARCHAR(255) NOT NULL, [email] NVARCHAR(255) NOT NULL, [password] NVARCHAR(255) NOT NULL, [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(), [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(), CONSTRAINT [UQ_users_nickname] UNIQUE ([nickname]), CONSTRAINT [UQ_users_email] UNIQUE ([email]), CONSTRAINT [PK_users] PRIMARY KEY ([id]))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE [users]`);
  }
}
