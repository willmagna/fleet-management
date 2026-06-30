import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { VehicleFormComponent } from './vehicle-form.component';
import { BrandService } from '../../../services/brand.service';
import { ModelService } from '../../../services/model.service';
import { VehicleService } from '../../../services/vehicle.service';
import { Brand } from '../../../core/models/brand.model';
import { VehicleModel } from '../../../core/models/model.model';
import { Vehicle } from '../../../core/models/vehicle.model';

const makeBrand = (overrides: Partial<Brand> = {}): Brand =>
  ({ id: 1, name: 'Fiat', active: true, ...overrides }) as Brand;

const makeModel = (overrides: Partial<VehicleModel> = {}): VehicleModel =>
  ({ id: 1, name: 'Uno', brandId: 1, active: true, ...overrides }) as VehicleModel;

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 5,
    licensePlate: 'ABC-1234',
    chassis: '123456',
    renavam: '987654',
    year: 2020,
    modelId: 1,
    model: makeModel({ brandId: 1 }),
    ...overrides,
  }) as Vehicle;

describe('VehicleFormComponent', () => {
  let component: VehicleFormComponent;
  let brandService: { findAll: ReturnType<typeof vi.fn> };
  let modelService: { findAll: ReturnType<typeof vi.fn> };
  let vehicleService: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let snackBarOpen: ReturnType<typeof vi.fn>;

  const setup = (paramId: string | null) => {
    TestBed.configureTestingModule({
      imports: [VehicleFormComponent],
      providers: [
        { provide: BrandService, useValue: brandService },
        { provide: ModelService, useValue: modelService },
        { provide: VehicleService, useValue: vehicleService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(paramId ? { id: paramId } : {}) } },
        },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(VehicleFormComponent);
    component = fixture.componentInstance;
    snackBarOpen = vi
      .spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockReturnValue({} as any);
  };

  beforeEach(() => {
    brandService = { findAll: vi.fn().mockReturnValue(of([makeBrand()])) };
    modelService = { findAll: vi.fn().mockReturnValue(of([makeModel()])) };
    vehicleService = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
  });

  describe('create mode', () => {
    beforeEach(() => setup(null));

    it('loads brands and models and stops loading without fetching a vehicle', () => {
      component.ngOnInit();

      expect(component.brands()).toEqual([makeBrand()]);
      expect(component.allModels()).toEqual([makeModel()]);
      expect(component.isEdit()).toBe(false);
      expect(component.loading()).toBe(false);
      expect(vehicleService.findOne).not.toHaveBeenCalled();
    });

    it('shows an error when loading brands/models fails', () => {
      brandService.findAll.mockReturnValue(throwError(() => new Error('boom')));

      component.ngOnInit();

      expect(snackBarOpen).toHaveBeenCalledWith('Erro ao carregar dados.', 'Fechar', {
        duration: 4000,
      });
      expect(component.loading()).toBe(false);
    });

    it('filters models by the selected brand', () => {
      modelService.findAll.mockReturnValue(
        of([makeModel({ id: 1, brandId: 1 }), makeModel({ id: 2, brandId: 2 })]),
      );
      component.ngOnInit();

      component.form.controls.brandId.setValue(2);

      expect(component.filteredModels()).toEqual([makeModel({ id: 2, brandId: 2 })]);
      expect(component.form.controls.modelId.value).toBe(0);
    });

    it('returns no models when no brand is selected', () => {
      component.ngOnInit();

      expect(component.filteredModels()).toEqual([]);
    });

    it('does not submit an invalid form', () => {
      component.ngOnInit();

      component.submit();

      expect(vehicleService.create).not.toHaveBeenCalled();
    });

    it('creates a vehicle and navigates to the list on success', () => {
      vehicleService.create.mockReturnValue(of(makeVehicle()));
      component.ngOnInit();
      component.form.setValue({
        licensePlate: 'ABC1234',
        chassis: '123456',
        renavam: '987654',
        year: 2020,
        brandId: 1,
        modelId: 1,
      });

      component.submit();

      expect(vehicleService.create).toHaveBeenCalledWith({
        licensePlate: 'ABC1234',
        chassis: '123456',
        renavam: '987654',
        year: 2020,
        modelId: 1,
      });
      expect(snackBarOpen).toHaveBeenCalledWith('Veículo cadastrado com sucesso.', 'Fechar', {
        duration: 3000,
      });
      expect(router.navigate).toHaveBeenCalledWith(['/vehicles']);
    });

    it('shows the server error message and stops saving when create fails', () => {
      vehicleService.create.mockReturnValue(
        throwError(() => ({ error: { message: 'placa duplicada' } })),
      );
      component.ngOnInit();
      component.form.setValue({
        licensePlate: 'ABC1234',
        chassis: '123456',
        renavam: '987654',
        year: 2020,
        brandId: 1,
        modelId: 1,
      });

      component.submit();

      expect(snackBarOpen).toHaveBeenCalledWith('placa duplicada', 'Fechar', { duration: 5000 });
      expect(component.saving()).toBe(false);
    });

    it('joins an array of server error messages', () => {
      vehicleService.create.mockReturnValue(
        throwError(() => ({ error: { message: ['erro 1', 'erro 2'] } })),
      );
      component.ngOnInit();
      component.form.setValue({
        licensePlate: 'ABC1234',
        chassis: '123456',
        renavam: '987654',
        year: 2020,
        brandId: 1,
        modelId: 1,
      });

      component.submit();

      expect(snackBarOpen).toHaveBeenCalledWith('erro 1, erro 2', 'Fechar', { duration: 5000 });
    });

    it('shows a generic message when create fails without a server message', () => {
      vehicleService.create.mockReturnValue(throwError(() => ({})));
      component.ngOnInit();
      component.form.setValue({
        licensePlate: 'ABC1234',
        chassis: '123456',
        renavam: '987654',
        year: 2020,
        brandId: 1,
        modelId: 1,
      });

      component.submit();

      expect(snackBarOpen).toHaveBeenCalledWith('Erro ao cadastrar veículo.', 'Fechar', {
        duration: 5000,
      });
    });
  });

  describe('edit mode', () => {
    beforeEach(() => setup('5'));

    it('loads the vehicle and patches the form', () => {
      vehicleService.findOne.mockReturnValue(of(makeVehicle()));

      component.ngOnInit();

      expect(component.isEdit()).toBe(true);
      expect(vehicleService.findOne).toHaveBeenCalledWith(5);
      expect(component.selectedBrandId()).toBe(1);
      expect(component.form.controls.licensePlate.value).toBe('ABC-1234');
      expect(component.loading()).toBe(false);
    });

    it('shows an error and navigates back when the vehicle is not found', () => {
      vehicleService.findOne.mockReturnValue(throwError(() => new Error('not found')));

      component.ngOnInit();

      expect(snackBarOpen).toHaveBeenCalledWith('Veículo não encontrado.', 'Fechar', {
        duration: 4000,
      });
      expect(router.navigate).toHaveBeenCalledWith(['/vehicles']);
    });

    it('updates the vehicle and navigates to the list on success', () => {
      vehicleService.findOne.mockReturnValue(of(makeVehicle()));
      vehicleService.update.mockReturnValue(of(makeVehicle()));
      component.ngOnInit();

      component.submit();

      expect(vehicleService.update).toHaveBeenCalledWith(5, {
        licensePlate: 'ABC-1234',
        chassis: '123456',
        renavam: '987654',
        year: 2020,
        modelId: 1,
      });
      expect(snackBarOpen).toHaveBeenCalledWith('Veículo atualizado com sucesso.', 'Fechar', {
        duration: 3000,
      });
      expect(router.navigate).toHaveBeenCalledWith(['/vehicles']);
    });

    it('shows a generic update error message when update fails without a server message', () => {
      vehicleService.findOne.mockReturnValue(of(makeVehicle()));
      vehicleService.update.mockReturnValue(throwError(() => ({})));
      component.ngOnInit();

      component.submit();

      expect(snackBarOpen).toHaveBeenCalledWith('Erro ao atualizar veículo.', 'Fechar', {
        duration: 5000,
      });
      expect(component.saving()).toBe(false);
    });
  });
});
