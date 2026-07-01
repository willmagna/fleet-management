import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BrandService } from './brand.service';
import { Brand } from '../core/models/brand.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

const makeBrand = (overrides: Partial<Brand> = {}): Brand => ({
  id: 1,
  name: 'Toyota',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'aivacol',
  updatedBy: null,
  ...overrides,
});

describe('BrandService', () => {
  let service: BrandService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BrandService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(BrandService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('findAll() sends a GET to /brands and returns the result', () => {
    const brands = [makeBrand(), makeBrand({ id: 2, name: 'Honda' })];
    let result: Brand[] | undefined;

    service.findAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/brands`);
    expect(req.request.method).toBe('GET');
    req.flush(brands);

    expect(result).toEqual(brands);
  });
});
