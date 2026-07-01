import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Brand } from '../../../core/models/brand.model';
import { VehicleModel } from '../../../core/models/model.model';
import { BrandService } from '../../../services/brand.service';
import { ModelService } from '../../../services/model.service';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss',
})
export class VehicleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private brandService = inject(BrandService);
  private modelService = inject(ModelService);
  private vehicleService = inject(VehicleService);
  private snackBar = inject(MatSnackBar);

  vehicleId = signal<number | null>(null);
  loading = signal(true);
  saving = signal(false);

  brands = signal<Brand[]>([]);
  allModels = signal<VehicleModel[]>([]);
  selectedBrandId = signal<number>(0);

  filteredModels = computed(() => {
    const brandId = this.selectedBrandId();
    if (!brandId) return [];
    return this.allModels().filter((m) => m.brandId === brandId);
  });

  isEdit = computed(() => this.vehicleId() !== null);

  form = this.fb.nonNullable.group({
    licensePlate: [
      '',
      [
        Validators.required,
        Validators.maxLength(8),
        Validators.pattern(/^[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}$/),
      ],
    ],
    chassis: ['', [Validators.required, Validators.maxLength(50)]],
    renavam: ['', [Validators.required, Validators.maxLength(20)]],
    year: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)],
    ],
    brandId: [0 as number, Validators.required],
    modelId: [0 as number, Validators.required],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) this.vehicleId.set(Number(idParam));

    forkJoin([this.brandService.findAll(), this.modelService.findAll()]).subscribe({
      next: ([brands, models]) => {
        this.brands.set(brands);
        this.allModels.set(models);

        if (this.vehicleId() !== null) {
          this.loadVehicle(this.vehicleId()!);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.snackBar.open('Erro ao carregar dados.', 'Fechar', { duration: 4000 });
        this.loading.set(false);
      },
    });

    this.form.controls.brandId.valueChanges.subscribe((brandId) => {
      this.selectedBrandId.set(brandId);
      this.form.controls.modelId.setValue(0);
    });
  }

  private loadVehicle(id: number): void {
    this.vehicleService.findOne(id).subscribe({
      next: (vehicle) => {
        this.selectedBrandId.set(vehicle.model.brandId);
        this.form.patchValue({
          licensePlate: vehicle.licensePlate,
          chassis: vehicle.chassis,
          renavam: vehicle.renavam,
          year: vehicle.year,
          brandId: vehicle.model.brandId,
          modelId: vehicle.modelId,
        });
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Veículo não encontrado.', 'Fechar', { duration: 4000 });
        this.router.navigate(['/vehicles']);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const { licensePlate, chassis, renavam, year, modelId } = this.form.getRawValue();
    this.saving.set(true);

    const payload = { licensePlate, chassis, renavam, year, modelId };
    const id = this.vehicleId();

    const request$ =
      id !== null
        ? this.vehicleService.update(id, payload)
        : this.vehicleService.create(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          id !== null ? 'Veículo atualizado com sucesso.' : 'Veículo cadastrado com sucesso.',
          'Fechar',
          { duration: 3000 },
        );
        this.router.navigate(['/vehicles']);
      },
      error: (err) => {
        const msg =
          err.error?.message ??
          (id !== null ? 'Erro ao atualizar veículo.' : 'Erro ao cadastrar veículo.');
        this.snackBar.open(Array.isArray(msg) ? msg.join(', ') : msg, 'Fechar', {
          duration: 5000,
        });
        this.saving.set(false);
      },
    });
  }
}
