import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CdkDragDrop,
  DragDropModule,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Vehicle, VehicleStatus, STATUS_LABELS } from '../../../core/models/vehicle.model';
import { VehicleService } from '../../../services/vehicle.service';

interface KanbanColumn {
  status: VehicleStatus;
  label: string;
}

type Board = Record<VehicleStatus, Vehicle[]>;

const COLUMN_STATUSES: VehicleStatus[] = ['disponivel', 'alugado', 'manutencao', 'inativo'];

@Component({
  selector: 'app-vehicle-kanban',
  imports: [
    RouterLink,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './vehicle-kanban.component.html',
  styleUrl: './vehicle-kanban.component.scss',
})
export class VehicleKanbanComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  readonly columns: KanbanColumn[] = COLUMN_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
  }));

  loading = signal(true);
  board = signal<Board>(this.emptyBoard());

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.vehicleService.findAll().subscribe({
      next: (vehicles) => {
        this.board.set(this.groupByStatus(vehicles));
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar veículos.', 'Fechar', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  drop(event: CdkDragDrop<Vehicle[]>, targetStatus: VehicleStatus): void {
    if (event.previousContainer === event.container) return;

    const vehicle = event.previousContainer.data[event.previousIndex];
    const previousStatus = vehicle.status;

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
    this.board.set({ ...this.board() });

    this.vehicleService.changeStatus(vehicle.id, { status: targetStatus }).subscribe({
      next: (updated) => {
        vehicle.status = updated.status;
        this.snackBar.open('Status atualizado com sucesso.', 'Fechar', { duration: 3000 });
      },
      error: (err) => {
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.container.data.indexOf(vehicle),
          event.previousIndex,
        );
        vehicle.status = previousStatus;
        this.board.set({ ...this.board() });
        this.snackBar.open(err.error?.message ?? 'Erro ao atualizar status.', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  editVehicle(id: number): void {
    this.router.navigate(['/vehicles', id, 'edit']);
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

  private groupByStatus(vehicles: Vehicle[]): Board {
    const board = this.emptyBoard();
    for (const vehicle of vehicles) {
      board[vehicle.status].push(vehicle);
    }
    return board;
  }

  private emptyBoard(): Board {
    return { disponivel: [], alugado: [], manutencao: [], inativo: [] };
  }
}
