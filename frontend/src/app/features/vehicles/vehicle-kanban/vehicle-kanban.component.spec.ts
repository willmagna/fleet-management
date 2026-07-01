import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { VehicleKanbanComponent } from './vehicle-kanban.component';
import { VehicleService } from '../../../services/vehicle.service';
import { Vehicle, VehicleStatus } from '../../../core/models/vehicle.model';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 1,
    licensePlate: 'ABC-1234',
    status: 'disponivel',
    ...overrides,
  }) as Vehicle;

const makeContainer = (data: Vehicle[]) => ({ data });

const makeDropEvent = (
  previousContainer: { data: Vehicle[] },
  container: { data: Vehicle[] },
  previousIndex: number,
  currentIndex: number,
): CdkDragDrop<Vehicle[]> =>
  ({
    previousContainer,
    container,
    previousIndex,
    currentIndex,
  }) as unknown as CdkDragDrop<Vehicle[]>;

describe('VehicleKanbanComponent', () => {
  let component: VehicleKanbanComponent;
  let vehicleService: { findAll: ReturnType<typeof vi.fn>; changeStatus: ReturnType<typeof vi.fn> };
  let snackBarOpen: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    vehicleService = { findAll: vi.fn().mockReturnValue(of([])), changeStatus: vi.fn() };

    TestBed.configureTestingModule({
      imports: [VehicleKanbanComponent],
      providers: [provideRouter([]), { provide: VehicleService, useValue: vehicleService }],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(VehicleKanbanComponent);
    component = fixture.componentInstance;
    snackBarOpen = vi
      .spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockReturnValue({} as any);
  });

  it('groups vehicles by status on init', () => {
    const vehicles = [
      makeVehicle({ id: 1, status: 'disponivel' }),
      makeVehicle({ id: 2, status: 'alugado' }),
      makeVehicle({ id: 3, status: 'disponivel' }),
    ];
    vehicleService.findAll.mockReturnValue(of(vehicles));

    component.ngOnInit();

    expect(component.board().disponivel).toEqual([vehicles[0], vehicles[2]]);
    expect(component.board().alugado).toEqual([vehicles[1]]);
    expect(component.board().manutencao).toEqual([]);
    expect(component.board().inativo).toEqual([]);
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

  it('does nothing when a card is dropped back into its own column', () => {
    const vehicle = makeVehicle({ status: 'disponivel' });
    const container = makeContainer([vehicle]);

    component.drop(makeDropEvent(container, container, 0, 0), 'disponivel');

    expect(vehicleService.changeStatus).not.toHaveBeenCalled();
  });

  it('moves the card and persists the new status when dropped in another column', () => {
    const vehicle = makeVehicle({ id: 5, status: 'disponivel' });
    vehicleService.findAll.mockReturnValue(
      of([vehicle, makeVehicle({ id: 6, status: 'alugado' })]),
    );
    component.ngOnInit();
    vehicleService.changeStatus.mockReturnValue(of({ ...vehicle, status: 'alugado' }));

    const disponivelContainer = makeContainer(component.board().disponivel);
    const alugadoContainer = makeContainer(component.board().alugado);
    component.drop(makeDropEvent(disponivelContainer, alugadoContainer, 0, 1), 'alugado');

    expect(vehicleService.changeStatus).toHaveBeenCalledWith(5, { status: 'alugado' });
    expect(component.board().disponivel).toEqual([]);
    expect(component.board().alugado.map((v) => v.id)).toEqual([6, 5]);
    expect(vehicle.status).toBe<VehicleStatus>('alugado');
    expect(snackBarOpen).toHaveBeenCalledWith('Status atualizado com sucesso.', 'Fechar', {
      duration: 3000,
    });
  });

  it('reverts the move and shows an error when the API rejects the status change', () => {
    const vehicle = makeVehicle({ id: 5, status: 'disponivel' });
    vehicleService.findAll.mockReturnValue(of([vehicle]));
    component.ngOnInit();
    vehicleService.changeStatus.mockReturnValue(
      throwError(() => ({ error: { message: 'Transição inválida.' } })),
    );

    const disponivelContainer = makeContainer(component.board().disponivel);
    const alugadoContainer = makeContainer(component.board().alugado);
    component.drop(makeDropEvent(disponivelContainer, alugadoContainer, 0, 0), 'alugado');

    expect(component.board().disponivel.map((v) => v.id)).toEqual([5]);
    expect(component.board().alugado).toEqual([]);
    expect(vehicle.status).toBe<VehicleStatus>('disponivel');
    expect(snackBarOpen).toHaveBeenCalledWith('Transição inválida.', 'Fechar', { duration: 4000 });
  });

  it('navigates to the edit route', () => {
    component.editVehicle(7);

    expect(router.navigate).toHaveBeenCalledWith(['/vehicles', 7, 'edit']);
  });

  it('maps each status to its CSS class', () => {
    expect(component.getStatusClass('disponivel')).toBe('status-disponivel');
    expect(component.getStatusClass('alugado')).toBe('status-alugado');
    expect(component.getStatusClass('manutencao')).toBe('status-manutencao');
    expect(component.getStatusClass('inativo')).toBe('status-inativo');
  });
});
