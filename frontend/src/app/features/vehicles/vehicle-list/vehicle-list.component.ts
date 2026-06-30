import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Vehicle, VehicleStatus, STATUS_LABELS } from '../../../core/models/vehicle.model';
import { VehicleService } from '../../../services/vehicle.service';
import { StatusDialogComponent } from '../status-dialog/status-dialog.component';

@Component({
  selector: 'app-vehicle-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss',
})
export class VehicleListComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  vehicles = signal<Vehicle[]>([]);
  loading = signal(true);
  displayedColumns = ['licensePlate', 'brand', 'model', 'year', 'status', 'actions'];
  readonly statusLabels: Record<string, string> = STATUS_LABELS;

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.vehicleService.findAll().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar veículos.', 'Fechar', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  openStatusDialog(vehicle: Vehicle): void {
    const ref = this.dialog.open(StatusDialogComponent, {
      width: '360px',
      data: vehicle,
    });

    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadVehicles();
    });
  }

  editVehicle(id: number): void {
    this.router.navigate(['/vehicles', id, 'edit']);
  }

  deleteVehicle(vehicle: Vehicle): void {
    if (!confirm(`Deseja remover o veículo ${vehicle.licensePlate}?`)) return;

    this.vehicleService.remove(vehicle.id).subscribe({
      next: () => {
        this.snackBar.open('Veículo removido com sucesso.', 'Fechar', { duration: 3000 });
        this.loadVehicles();
      },
      error: () => {
        this.snackBar.open('Erro ao remover veículo.', 'Fechar', { duration: 4000 });
      },
    });
  }

  getStatusClass(status: VehicleStatus): string {
    const map: Record<VehicleStatus, string> = {
      disponivel: 'status-disponivel',
      alugado: 'status-alugado',
      manutencao: 'status-manutencao',
      inativo: 'status-inativo',
    };
    return map[status];
  }
}
