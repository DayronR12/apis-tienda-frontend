import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Producto {
  id?: number;
  nombre?: string;
  marca?: string;
  precio?: number | string;
  cantidad?: number;
  categoria?: string;
  categoria_id?: number;
  [clave: string]: unknown;
}

export interface CrearProductoPayload {
  nombre: string;
  marca: string;
  cantidad: number;
  precio: number;
  categoria_id?: number;
}

export type ActualizarProductoPayload = Partial<CrearProductoPayload>;

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  getProductos(): Observable<Producto[] | { productos: Producto[] }> {
    return this.http.get<Producto[] | { productos: Producto[] }>(this.buildUrl('/productos/'));
  }

  getProducto(id: number | string): Observable<Producto> {
    return this.http.get<Producto>(this.buildUrl(`/productos/${id}`));
  }

  addProducto(payload: CrearProductoPayload): Observable<Producto> {
    return this.http.post<Producto>(this.buildUrl('/productos/add'), payload);
  }

  updateProducto(id: number | string, payload: ActualizarProductoPayload): Observable<Producto> {
    return this.http.put<Producto>(this.buildUrl(`/productos/update/${id}`), payload);
  }

  deleteProducto(id: number | string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/productos/delete/${id}`));
  }
}
