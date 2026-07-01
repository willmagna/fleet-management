import { Test, TestingModule } from '@nestjs/testing';
import { Brand } from './brand.entity';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

const mockBrand = (overrides: Partial<Brand> = {}): Brand =>
  ({
    id: 1,
    name: 'Toyota',
    active: true,
    createdBy: 'aivacol',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Brand;

const req = { user: { nickname: 'aivacol' } };

describe('BrandsController', () => {
  let controller: BrandsController;
  let service: jest.Mocked<BrandsService>;

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<BrandsService>> = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [{ provide: BrandsService, useValue: mockService }],
    }).compile();

    controller = module.get<BrandsController>(BrandsController);
    service = module.get(BrandsService);
  });

  it('findAll delegates to BrandsService.findAll', async () => {
    const brands = [mockBrand()];
    service.findAll.mockResolvedValue(brands);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(brands);
  });

  it('findOne delegates to BrandsService.findOne with the route id', async () => {
    const brand = mockBrand();
    service.findOne.mockResolvedValue(brand);

    const result = await controller.findOne('1');

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(brand);
  });

  it('create passes body and authenticated user nickname to BrandsService.create', async () => {
    const body = { name: 'Honda' } as Partial<Brand>;
    const brand = mockBrand({ name: 'Honda', createdBy: 'aivacol' });
    service.create.mockResolvedValue(brand);

    const result = await controller.create(body, req);

    expect(service.create).toHaveBeenCalledWith(body, 'aivacol');
    expect(result).toEqual(brand);
  });

  it('update passes id, body, and nickname to BrandsService.update', async () => {
    const body = { name: 'Toyota Updated' } as Partial<Brand>;
    const updated = mockBrand({ name: 'Toyota Updated', updatedBy: 'aivacol' });
    service.update.mockResolvedValue(updated);

    const result = await controller.update('1', body, req);

    expect(service.update).toHaveBeenCalledWith('1', body, 'aivacol');
    expect(result).toEqual(updated);
  });

  it('remove passes id and nickname to BrandsService.remove', async () => {
    const response = { status: 'ok', message: 'brand id: 1 has been deleted' };
    service.remove.mockResolvedValue(response);

    const result = await controller.remove('1', req);

    expect(service.remove).toHaveBeenCalledWith('1', 'aivacol');
    expect(result).toEqual(response);
  });
});
