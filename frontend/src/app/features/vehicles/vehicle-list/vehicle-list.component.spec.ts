import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { VehicleListComponent } from './vehicle-list.component';
import { VehicleService } from '../../../services/vehicle.service';
import { Vehicle } from '../../../core/models/vehicle.model';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 1,
    licensePlate: 'ABC-1234',
    status: 'disponivel',
    ...overrides,
  }) as Vehicle;

describe('VehicleListComponent', () => {
  let component: VehicleListComponent;
  let vehicleService: { findAll: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let snackBarOpen: ReturnType<typeof vi.fn>;
  let dialogOpen: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    vehicleService = { findAll: vi.fn().mockReturnValue(of([])), remove: vi.fn() };

    TestBed.configureTestingModule({
      imports: [VehicleListComponent],
      providers: [provideRouter([]), { provide: VehicleService, useValue: vehicleService }],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // MatSnackBar/MatDialog are resolved by the component's own environment injector
    // (created because it imports MatSnackBarModule/MatDialogModule), so a root-level
    // TestBed provider override never reaches the instance the component actually uses.
    // Spy on the instance the component injects instead.
    const fixture = TestBed.createComponent(VehicleListComponent);
    component = fixture.componentInstance;
    snackBarOpen = vi
      .spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockReturnValue({} as any);
    dialogOpen = vi.spyOn(fixture.debugElement.injector.get(MatDialog), 'open');
  });

  it('loads vehicles on init', () => {
    const vehicles = [makeVehicle()];
    vehicleService.findAll.mockReturnValue(of(vehicles));

    component.ngOnInit();

    expect(component.vehicles()).toEqual(vehicles);
    expect(component.loading()).toBe(false);
  });

  it('shows an error and stops loading when the list request fails', () => {
    vehicleService.findAll.mockReturnValue(throwError(() => new Error('boom')));

    component.ngOnInit();

    expect(snackBarOpen).toHaveBeenCalledWith('Erro ao carregar veículos.', 'Fechar', {
      duration: 4000,
    });
    expect(component.loading()).toBe(false);
  });

  it('reloads the list after the status dialog closes with a change', () => {
    const reloadSpy = vi.spyOn(component, 'loadVehicles');
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });

    component.openStatusDialog(makeVehicle());

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('does not reload the list when the status dialog closes without a change', () => {
    const reloadSpy = vi.spyOn(component, 'loadVehicles');
    reloadSpy.mockClear();
    dialogOpen.mockReturnValue({ afterClosed: () => of(false) });

    component.openStatusDialog(makeVehicle());

    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('navigates to the edit route', () => {
    component.editVehicle(7);

    expect(router.navigate).toHaveBeenCalledWith(['/vehicles', 7, 'edit']);
  });

  it('removes the vehicle and reloads when the user confirms', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vehicleService.remove.mockReturnValue(of({ status: 'ok' }));
    const reloadSpy = vi.spyOn(component, 'loadVehicles');

    component.deleteVehicle(makeVehicle({ id: 9 }));

    expect(vehicleService.remove).toHaveBeenCalledWith(9);
    expect(snackBarOpen).toHaveBeenCalledWith('Veículo removido com sucesso.', 'Fechar', {
      duration: 3000,
    });
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('does nothing when the user cancels the delete confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteVehicle(makeVehicle());

    expect(vehicleService.remove).not.toHaveBeenCalled();
  });

  it('shows an error when removal fails', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vehicleService.remove.mockReturnValue(throwError(() => new Error('boom')));

    component.deleteVehicle(makeVehicle());

    expect(snackBarOpen).toHaveBeenCalledWith('Erro ao remover veículo.', 'Fechar', {
      duration: 4000,
    });
  });

  it('maps each status to its CSS class', () => {
    expect(component.getStatusClass('disponivel')).toBe('status-disponivel');
    expect(component.getStatusClass('alugado')).toBe('status-alugado');
    expect(component.getStatusClass('manutencao')).toBe('status-manutencao');
    expect(component.getStatusClass('inativo')).toBe('status-inativo');
  });
});
