import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehicleModel } from '../core/models/model.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ModelService {
  private http = inject(HttpClient);

  findAll(): Observable<VehicleModel[]> {
    return this.http.get<VehicleModel[]>(`${API}/models`);
  }
}
