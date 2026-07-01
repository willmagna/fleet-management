import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleService } from './vehicle.service';
import { Vehicle } from '../core/models/vehicle.model';
import { VehicleModel } from '../core/models/model.model';
import { Brand } from '../core/models/brand.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

const makeBrand = (): Brand => ({
  id: 1,
  name: 'Toyota',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'aivacol',
  updatedBy: null,
});

const makeModel = (): VehicleModel => ({
  id: 1,
  name: 'Corolla',
  brand: makeBrand(),
  brandId: 1,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'aivacol',
  updatedBy: null,
});

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 1,
  licensePlate: 'ABC-1234',
  chassis: '9BWZZZ377VT004251',
  renavam: '12345678901',
  year: 2022,
  model: makeModel(),
  modelId: 1,
  status: 'disponivel',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'aivacol',
  updatedBy: null,
  ...overrides,
});

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VehicleService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('findAll() sends a GET to /vehicles', () => {
    const vehicles = [makeVehicle()];
    let result: Vehicle[] | undefined;

    service.findAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/vehicles`);
    expect(req.request.method).toBe('GET');
    req.flush(vehicles);

    expect(result).toEqual(vehicles);
  });

  it('findOne() sends a GET to /vehicles/:id', () => {
    const vehicle = makeVehicle();
    let result: Vehicle | undefined;

    service.findOne(1).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/vehicles/1`);
    expect(req.request.method).toBe('GET');
    req.flush(vehicle);

    expect(result).toEqual(vehicle);
  });

  it('create() sends a POST with the payload', () => {
    const payload = {
      licensePlate: 'ABC-1234',
      chassis: '9BWZZZ377VT004251',
      renavam: '12345678901',
      year: 2022,
      modelId: 1,
    };
    const created = makeVehicle();

    service.create(payload).subscribe();

    const req = httpMock.expectOne(`${API}/vehicles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(created);
  });

  it('update() sends a PUT to /vehicles/:id with the payload', () => {
    const payload = { year: 2024 };
    const updated = makeVehicle({ year: 2024 });

    service.update(1, payload).subscribe();

    const req = httpMock.expectOne(`${API}/vehicles/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(updated);
  });

  it('changeStatus() sends a PATCH to /vehicles/:id/status', () => {
    const payload = { status: 'alugado' as const, notes: 'Contrato 001' };

    service.changeStatus(1, payload).subscribe();

    const req = httpMock.expectOne(`${API}/vehicles/1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(makeVehicle({ status: 'alugado' }));
  });

  it('remove() sends a DELETE to /vehicles/:id', () => {
    service.remove(1).subscribe();

    const req = httpMock.expectOne(`${API}/vehicles/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: 'ok' });
  });
});
