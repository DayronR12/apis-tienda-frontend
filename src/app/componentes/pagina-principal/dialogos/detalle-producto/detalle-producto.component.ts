import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';

import { InventarioService, Producto } from '../../../../servicios/inventario.service';

type EstadoDetalle = 'cargando' | 'exito' | 'error';

interface DetalleProductoData {
  id: number;
}

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './detalle-producto.component.html',
  styleUrl: './detalle-producto.component.css'
})
export class DetalleProductoComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DetalleProductoComponent>);
  readonly data = inject<DetalleProductoData>(MAT_DIALOG_DATA);
  private readonly inventarioService = inject(InventarioService);
  private readonly cdr = inject(ChangeDetectorRef);

  estado: EstadoDetalle = 'cargando';
  producto?: Producto;

  ngOnInit(): void {
    this.inventarioService
      .getProducto(this.data.id)
      .pipe(
        take(1),
        catchError(() => {
          this.estado = 'error';
          this.cdr.markForCheck();
          return of(null);
        })
      )
      .subscribe((producto) => {
        const productoNormalizado = this.normalizarProducto(producto);
        if (productoNormalizado) {
          this.producto = productoNormalizado;
          this.estado = 'exito';
        } else {
          this.estado = 'error';
        }
        this.cdr.markForCheck();
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  formatPrecio(valor: Producto['precio']): number {
    if (valor === null || valor === undefined) {
      return 0;
    }

    if (typeof valor === 'string') {
      const parsed = Number(valor);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return valor;
  }

  private normalizarProducto(respuesta: unknown): Producto | null {
    if (!respuesta) {
      return null;
    }

    if (Array.isArray(respuesta)) {
      return (respuesta[0] as Producto) ?? null;
    }

    if (typeof respuesta === 'object') {
      const objeto = respuesta as { producto?: Producto; data?: Producto } & Producto;
      if (objeto.producto) {
        return objeto.producto;
      }
      if (objeto.data) {
        return objeto.data;
      }
      return objeto;
    }

    return null;
  }
}
