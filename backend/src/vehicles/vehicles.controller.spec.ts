import { Test, TestingModule } from '@nestjs/testing';
import { Vehicle } from './vehicle.entity';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 1,
    licensePlate: 'ABC-1234',
    chassis: 'CHS0000001',
    renavam: '12345678901',
    year: 2022,
    modelId: 1,
    active: true,
    createdBy: 'aivacol',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Vehicle;

const req = { user: { nickname: 'aivacol' } };

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: jest.Mocked<VehiclesService>;

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<VehiclesService>> = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get(VehiclesService);
  });

  it('findAll delegates to VehiclesService.findAll', async () => {
    const vehicles = [makeVehicle()];
    service.findAll.mockResolvedValue(vehicles);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(vehicles);
  });

  it('findOne delegates to VehiclesService.findOne with the route id', async () => {
    const vehicle = makeVehicle();
    service.findOne.mockResolvedValue(vehicle);

    const result = await controller.findOne('1');

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(vehicle);
  });

  it('create passes body and authenticated user nickname to VehiclesService.create', async () => {
    const body = { licensePlate: 'XYZ-9999', modelId: 2, year: 2023 } as Partial<Vehicle>;
    const vehicle = makeVehicle({ ...body, createdBy: 'aivacol' });
    service.create.mockResolvedValue(vehicle);

    const result = await controller.create(body, req);

    expect(service.create).toHaveBeenCalledWith(body, 'aivacol');
    expect(result).toEqual(vehicle);
  });

  it('update passes id, body, and nickname to VehiclesService.update', async () => {
    const body = { year: 2024 } as Partial<Vehicle>;
    const updated = makeVehicle({ year: 2024, updatedBy: 'aivacol' });
    service.update.mockResolvedValue(updated);

    const result = await controller.update('1', body, req);

    expect(service.update).toHaveBeenCalledWith('1', body, 'aivacol');
    expect(result).toEqual(updated);
  });

  it('remove passes id and nickname to VehiclesService.remove', async () => {
    const response = { status: 'ok', message: 'vehicle id: 1 has been deleted' };
    service.remove.mockResolvedValue(response);

    const result = await controller.remove('1', req);

    expect(service.remove).toHaveBeenCalledWith('1', 'aivacol');
    expect(result).toEqual(response);
  });
});
