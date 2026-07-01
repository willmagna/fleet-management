import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateVehicleDto } from './create-vehicle.dto';
import { UpdateVehicleDto } from './update-vehicle.dto';

const validCreate = {
  licensePlate: 'ABC-1234',
  chassis: 'CHS0000000001',
  renavam: '12345678901',
  year: 2022,
  modelId: 1,
};

describe('Vehicle DTOs', () => {
  describe('CreateVehicleDto', () => {
    it('passes with all valid fields', async () => {
      const dto = plainToInstance(CreateVehicleDto, validCreate);
      expect(await validate(dto)).toHaveLength(0);
    });

    it('fails when licensePlate is missing', async () => {
      const { licensePlate: _, ...rest } = validCreate;
      const errors = await validate(plainToInstance(CreateVehicleDto, rest));
      expect(errors.some((e) => e.property === 'licensePlate')).toBe(true);
    });

    it('fails when licensePlate exceeds 20 characters', async () => {
      const dto = plainToInstance(CreateVehicleDto, { ...validCreate, licensePlate: 'A'.repeat(21) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'licensePlate')).toBe(true);
    });

    it('fails when chassis is missing', async () => {
      const { chassis: _, ...rest } = validCreate;
      const errors = await validate(plainToInstance(CreateVehicleDto, rest));
      expect(errors.some((e) => e.property === 'chassis')).toBe(true);
    });

    it('fails when chassis exceeds 17 characters', async () => {
      const dto = plainToInstance(CreateVehicleDto, { ...validCreate, chassis: 'A'.repeat(18) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chassis')).toBe(true);
    });

    it('fails when renavam is missing', async () => {
      const { renavam: _, ...rest } = validCreate;
      const errors = await validate(plainToInstance(CreateVehicleDto, rest));
      expect(errors.some((e) => e.property === 'renavam')).toBe(true);
    });

    it('fails when renavam exceeds 11 characters', async () => {
      const dto = plainToInstance(CreateVehicleDto, { ...validCreate, renavam: '1'.repeat(12) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'renavam')).toBe(true);
    });

    it('fails when year is missing', async () => {
      const { year: _, ...rest } = validCreate;
      const errors = await validate(plainToInstance(CreateVehicleDto, rest));
      expect(errors.some((e) => e.property === 'year')).toBe(true);
    });

    it('fails when year is before 1900', async () => {
      const dto = plainToInstance(CreateVehicleDto, { ...validCreate, year: 1899 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'year')).toBe(true);
    });

    it('fails when year is not an integer', async () => {
      const dto = plainToInstance(CreateVehicleDto, { ...validCreate, year: 2022.5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'year')).toBe(true);
    });

    it('fails when modelId is missing', async () => {
      const { modelId: _, ...rest } = validCreate;
      const errors = await validate(plainToInstance(CreateVehicleDto, rest));
      expect(errors.some((e) => e.property === 'modelId')).toBe(true);
    });

    it('fails when modelId is less than 1', async () => {
      const dto = plainToInstance(CreateVehicleDto, { ...validCreate, modelId: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'modelId')).toBe(true);
    });
  });

  describe('UpdateVehicleDto', () => {
    it('passes when body is empty (all fields optional)', async () => {
      const dto = plainToInstance(UpdateVehicleDto, {});
      expect(await validate(dto)).toHaveLength(0);
    });

    it('passes with only year provided', async () => {
      const dto = plainToInstance(UpdateVehicleDto, { year: 2024 });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('passes with only modelId provided', async () => {
      const dto = plainToInstance(UpdateVehicleDto, { modelId: 3 });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('fails when year is before 1900', async () => {
      const dto = plainToInstance(UpdateVehicleDto, { year: 1800 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'year')).toBe(true);
    });

    it('fails when licensePlate exceeds 20 characters', async () => {
      const dto = plainToInstance(UpdateVehicleDto, { licensePlate: 'A'.repeat(21) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'licensePlate')).toBe(true);
    });

    it('fails when modelId is less than 1', async () => {
      const dto = plainToInstance(UpdateVehicleDto, { modelId: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'modelId')).toBe(true);
    });
  });
});
