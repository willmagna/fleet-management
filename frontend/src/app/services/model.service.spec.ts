import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ModelService } from './model.service';
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

const makeModel = (overrides: Partial<VehicleModel> = {}): VehicleModel => ({
  id: 1,
  name: 'Corolla',
  brand: makeBrand(),
  brandId: 1,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'aivacol',
  updatedBy: null,
  ...overrides,
});

describe('ModelService', () => {
  let service: ModelService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModelService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ModelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('findAll() sends a GET to /models and returns the result', () => {
    const models = [makeModel(), makeModel({ id: 2, name: 'Hilux' })];
    let result: VehicleModel[] | undefined;

    service.findAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/models`);
    expect(req.request.method).toBe('GET');
    req.flush(models);

    expect(result).toEqual(models);
  });
});
