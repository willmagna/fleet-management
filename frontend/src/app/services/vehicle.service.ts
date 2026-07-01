import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Vehicle,
  CreateVehicleDto,
  UpdateVehicleDto,
  ChangeStatusDto,
} from '../core/models/vehicle.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private http = inject(HttpClient);

  findAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${API}/vehicles`);
  }

  findOne(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${API}/vehicles/${id}`);
  }

  create(data: CreateVehicleDto): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${API}/vehicles`, data);
  }

  update(id: number, data: UpdateVehicleDto): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${API}/vehicles/${id}`, data);
  }

  changeStatus(id: number, data: ChangeStatusDto): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${API}/vehicles/${id}/status`, data);
  }

  remove(id: number): Observable<object> {
    return this.http.delete<object>(`${API}/vehicles/${id}`);
  }
}
