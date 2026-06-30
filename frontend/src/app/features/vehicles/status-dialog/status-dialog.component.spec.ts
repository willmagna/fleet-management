import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StatusDialogComponent } from './status-dialog.component';
import { VehicleService } from '../../../services/vehicle.service';
import { Vehicle } from '../../../core/models/vehicle.model';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 1,
    licensePlate: 'ABC-1234',
    status: 'disponivel',
    ...overrides,
  }) as Vehicle;

describe('StatusDialogComponent', () => {
  let component: StatusDialogComponent;
  let vehicleService: { changeStatus: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  const setup = (vehicle: Vehicle) => {
    vehicleService = { changeStatus: vi.fn() };
    dialogRef = { close: vi.fn() };
    snackBar = { open: vi.fn() };

    TestBed.configureTestingModule({
      imports: [StatusDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: vehicle },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: VehicleService, useValue: vehicleService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });

    component = TestBed.createComponent(StatusDialogComponent).componentInstance;
  };

  it('creates with the vehicle current status pre-filled', () => {
    setup(makeVehicle({ status: 'disponivel' }));

    expect(component.form.controls.status.value).toBe('disponivel');
  });

  it('rejects submitting the same status without calling the API', () => {
    setup(makeVehicle({ status: 'disponivel' }));
    component.form.controls.status.setValue('disponivel');

    component.submit();

    expect(vehicleService.changeStatus).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'O veículo já está neste status.',
      'Fechar',
      { duration: 3000 },
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('changes the status and closes the dialog with true on success', () => {
    setup(makeVehicle({ id: 5, status: 'disponivel' }));
    vehicleService.changeStatus.mockReturnValue(of(makeVehicle({ status: 'alugado' })));
    component.form.setValue({ status: 'alugado', notes: 'Contrato 001' });

    component.submit();

    expect(vehicleService.changeStatus).toHaveBeenCalledWith(5, {
      status: 'alugado',
      notes: 'Contrato 001',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('sends undefined notes when left blank', () => {
    setup(makeVehicle({ id: 5, status: 'disponivel' }));
    vehicleService.changeStatus.mockReturnValue(of(makeVehicle({ status: 'alugado' })));
    component.form.setValue({ status: 'alugado', notes: '' });

    component.submit();

    expect(vehicleService.changeStatus).toHaveBeenCalledWith(5, {
      status: 'alugado',
      notes: undefined,
    });
  });

  it('shows an error and does not close the dialog on failure', () => {
    setup(makeVehicle({ id: 5, status: 'disponivel' }));
    vehicleService.changeStatus.mockReturnValue(
      throwError(() => ({ error: { message: 'boom' } })),
    );
    component.form.setValue({ status: 'alugado', notes: '' });

    component.submit();

    expect(snackBar.open).toHaveBeenCalledWith('boom', 'Fechar', { duration: 4000 });
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('cancel() closes the dialog with false', () => {
    setup(makeVehicle());

    component.cancel();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
