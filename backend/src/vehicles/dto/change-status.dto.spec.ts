import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ChangeStatusDto, VEHICLE_STATUSES } from './change-status.dto';

describe('ChangeStatusDto', () => {
  it('passes validation for every allowed status', async () => {
    for (const status of VEHICLE_STATUSES) {
      const dto = plainToInstance(ChangeStatusDto, { status });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('fails when status is not one of the allowed values', async () => {
    const dto = plainToInstance(ChangeStatusDto, { status: 'indisponivel' });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('fails when status is missing', async () => {
    const dto = plainToInstance(ChangeStatusDto, {});
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('passes when notes is omitted (optional field)', async () => {
    const dto = plainToInstance(ChangeStatusDto, { status: 'disponivel' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes when notes is a string within the 500-char limit', async () => {
    const dto = plainToInstance(ChangeStatusDto, {
      status: 'manutencao',
      notes: 'Revisão de 50.000 km',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails when notes exceeds 500 characters', async () => {
    const dto = plainToInstance(ChangeStatusDto, {
      status: 'manutencao',
      notes: 'x'.repeat(501),
    });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });

  it('fails when notes is not a string', async () => {
    const dto = plainToInstance(ChangeStatusDto, { status: 'disponivel', notes: 123 });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });
});
