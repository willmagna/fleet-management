import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Brand } from '../core/models/brand.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);

  findAll(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${API}/brands`);
  }
}
