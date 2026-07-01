import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBrandDto } from './create-brand.dto';
import { UpdateBrandDto } from './update-brand.dto';

describe('Brand DTOs', () => {
  describe('CreateBrandDto', () => {
    it('passes with a valid name', async () => {
      const dto = plainToInstance(CreateBrandDto, { name: 'Toyota' });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('fails when name is missing', async () => {
      const dto = plainToInstance(CreateBrandDto, {});
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when name is an empty string', async () => {
      const dto = plainToInstance(CreateBrandDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when name is not a string', async () => {
      const dto = plainToInstance(CreateBrandDto, { name: 123 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when name exceeds 255 characters', async () => {
      const dto = plainToInstance(CreateBrandDto, { name: 'a'.repeat(256) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });
  });

  describe('UpdateBrandDto', () => {
    it('passes when body is empty (all fields optional)', async () => {
      const dto = plainToInstance(UpdateBrandDto, {});
      expect(await validate(dto)).toHaveLength(0);
    });

    it('passes with a valid name', async () => {
      const dto = plainToInstance(UpdateBrandDto, { name: 'Honda' });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('fails when name is an empty string', async () => {
      const dto = plainToInstance(UpdateBrandDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('fails when name exceeds 255 characters', async () => {
      const dto = plainToInstance(UpdateBrandDto, { name: 'a'.repeat(256) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });
  });
});
