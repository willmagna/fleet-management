import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateModelDto } from './create-model.dto';
import { UpdateModelDto } from './update-model.dto';

describe('Model DTOs', () => {
  describe('CreateModelDto', () => {
    it('passes with valid name and brandId', async () => {
      const dto = plainToInstance(CreateModelDto, { name: 'Corolla', brandId: 1 });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('fails when name is missing', async () => {
      const dto = plainToInstance(CreateModelDto, { brandId: 1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when name is an empty string', async () => {
      const dto = plainToInstance(CreateModelDto, { name: '', brandId: 1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when name exceeds 255 characters', async () => {
      const dto = plainToInstance(CreateModelDto, { name: 'a'.repeat(256), brandId: 1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when brandId is missing', async () => {
      const dto = plainToInstance(CreateModelDto, { name: 'Corolla' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'brandId')).toBe(true);
    });

    it('fails when brandId is not an integer', async () => {
      const dto = plainToInstance(CreateModelDto, { name: 'Corolla', brandId: 1.5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'brandId')).toBe(true);
    });

    it('fails when brandId is less than 1', async () => {
      const dto = plainToInstance(CreateModelDto, { name: 'Corolla', brandId: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'brandId')).toBe(true);
    });
  });

  describe('UpdateModelDto', () => {
    it('passes when body is empty (all fields optional)', async () => {
      const dto = plainToInstance(UpdateModelDto, {});
      expect(await validate(dto)).toHaveLength(0);
    });

    it('passes with only name provided', async () => {
      const dto = plainToInstance(UpdateModelDto, { name: 'Civic' });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('passes with only brandId provided', async () => {
      const dto = plainToInstance(UpdateModelDto, { brandId: 2 });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('fails when name is an empty string', async () => {
      const dto = plainToInstance(UpdateModelDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when brandId is less than 1', async () => {
      const dto = plainToInstance(UpdateModelDto, { brandId: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'brandId')).toBe(true);
    });
  });
});
