import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Vehicle, VehicleStatus, STATUS_LABELS } from '../../../core/models/vehicle.model';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-status-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './status-dialog.component.html',
})
export class StatusDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<StatusDialogComponent>);
  private vehicleService = inject(VehicleService);
  private snackBar = inject(MatSnackBar);

  vehicle = inject<Vehicle>(MAT_DIALOG_DATA);
  loading = signal(false);
  statusLabels = STATUS_LABELS;

  statusOptions: VehicleStatus[] = ['disponivel', 'alugado', 'manutencao', 'inativo'];

  form = this.fb.nonNullable.group({
    status: [this.vehicle.status as VehicleStatus, Validators.required],
    notes: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { status, notes } = this.form.getRawValue();

    if (status === this.vehicle.status) {
      this.snackBar.open('O veículo já está neste status.', 'Fechar', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    this.vehicleService
      .changeStatus(this.vehicle.id, { status, notes: notes || undefined })
      .subscribe({
        next: () => {
          this.snackBar.open('Status atualizado com sucesso.', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message ?? 'Erro ao atualizar status.',
            'Fechar',
            { duration: 4000 },
          );
          this.loading.set(false);
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
