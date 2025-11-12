import { AsyncPipe, CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import {
  ActualizarProductoPayload,
  CrearProductoPayload,
  InventarioService,
  Producto
} from '../../servicios/inventario.service';
import { DetalleProductoComponent } from './dialogos/detalle-producto/detalle-producto.component';
import { FormularioProductoComponent } from './dialogos/formulario-producto/formulario-producto.component';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, AsyncPipe],
  templateUrl: './pagina-principal.component.html',
  styleUrl: './pagina-principal.component.css'
})
export class PaginaPrincipalComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly productosSubject = new BehaviorSubject<Producto[]>([]);
  readonly productos$: Observable<Producto[]> = this.productosSubject.asObservable();

  cargando = true;
  errorCarga = false;
  eliminandoIds = new Set<number>();
  editandoIds = new Set<number>();
  agregando = false;

  async ngOnInit(): Promise<void> {
    await this.cargarProductos();
  }

  async cargarProductos(): Promise<void> {
    this.cargando = true;
    this.errorCarga = false;
    try {
      const respuesta = await firstValueFrom(
        this.inventarioService.getProductos().pipe(
          catchError((error) => {
            console.error('Error al obtener productos', error);
            this.errorCarga = true;
            return of([]);
          })
        )
      );
      const productosNormalizados = this.normalizarProductos(respuesta);
      this.productosSubject.next(productosNormalizados);
      this.errorCarga = false;
    } catch (error) {
      this.productosSubject.next([]);
      this.errorCarga = true;
    } finally {
      this.cargando = false;
    }
  }

  async agregarProducto(): Promise<void> {
    if (this.agregando) {
      return;
    }

    const dialogRef = this.dialog.open(FormularioProductoComponent, {
      width: '800px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'formulario-producto-dialog',
      data: {
        titulo: 'Agregar producto',
        descripcion: 'Completa la información para registrar un nuevo artículo.',
        confirmLabel: 'Guardar',
        producto: {
          nombre: '',
          marca: '',
          cantidad: null,
          precio: null,
          categoria_id: null
        }
      }
    });

    const resultado = await firstValueFrom(
      dialogRef.afterClosed() as Observable<CrearProductoPayload | undefined>
    );
    if (!resultado) {
      return;
    }

    const payload: CrearProductoPayload = {
      nombre: (resultado.nombre ?? '').trim(),
      marca: (resultado.marca ?? '').trim(),
      cantidad: Number(resultado.cantidad ?? 0),
      precio: Number(resultado.precio ?? 0)
    };

    if (resultado.categoria_id !== undefined && resultado.categoria_id !== null) {
      const categoriaId = Number(resultado.categoria_id);
      if (!Number.isNaN(categoriaId) && categoriaId > 0) {
        payload.categoria_id = categoriaId;
      } else {
        this.snackBar.open('La categoría debe ser un número mayor a 0.', 'Cerrar', { duration: 4000 });
        return;
      }
    }

    const datosInvalidos =
      !payload.nombre ||
      !payload.marca ||
      Number.isNaN(payload.cantidad) ||
      Number.isNaN(payload.precio);

    if (datosInvalidos) {
      this.snackBar.open('Por favor completa los campos requeridos.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.agregando = true;
    try {
      await firstValueFrom(this.inventarioService.addProducto(payload));
      this.snackBar.open('Producto agregado correctamente.', 'Cerrar', { duration: 3000 });
      await this.cargarProductos();
    } catch (error) {
      console.error('Error al agregar producto', error);
      const httpError = error as HttpErrorResponse;
      let mensaje = 'No se pudo agregar el producto. Intenta nuevamente.';

      if (httpError?.error) {
        if (typeof httpError.error === 'string' && httpError.error.trim()) {
          mensaje = httpError.error;
        } else if (typeof httpError.error?.message === 'string' && httpError.error.message.trim()) {
          mensaje = httpError.error.message;
        }
      }

      this.snackBar.open(mensaje, 'Cerrar', {
        duration: 5000
      });
    } finally {
      this.agregando = false;
    }
  }

  async editarProducto(producto: Producto): Promise<void> {
    const id = this.obtenerIdNumerico(producto);
    if (id === null || this.editandoIds.has(id)) {
      return;
    }

    const dialogRef = this.dialog.open(FormularioProductoComponent, {
      width: '800px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'formulario-producto-dialog',
      data: {
        titulo: 'Editar producto',
        descripcion: `Actualiza la información de ${producto.nombre ?? 'este producto'}.`,
        confirmLabel: 'Actualizar',
        producto
      }
    });

    const resultado = await firstValueFrom(
      dialogRef.afterClosed() as Observable<CrearProductoPayload | undefined>
    );
    if (!resultado) {
      return;
    }

    const payload: ActualizarProductoPayload = {
      nombre: (resultado.nombre ?? '').trim(),
      marca: (resultado.marca ?? '').trim(),
      cantidad: Number(resultado.cantidad ?? 0),
      precio: Number(resultado.precio ?? 0)
    };

    if (resultado.categoria_id !== undefined && resultado.categoria_id !== null) {
      const categoriaId = Number(resultado.categoria_id);
      if (!Number.isNaN(categoriaId) && categoriaId > 0) {
        payload.categoria_id = categoriaId;
      } else {
        this.snackBar.open('La categoría debe ser un número mayor a 0.', 'Cerrar', { duration: 4000 });
        return;
      }
    }

    const datosInvalidos =
      !payload.nombre ||
      !payload.marca ||
      Number.isNaN(payload.cantidad ?? NaN) ||
      Number.isNaN(payload.precio ?? NaN);

    if (datosInvalidos) {
      this.snackBar.open('Por favor completa los campos requeridos.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.editandoIds.add(id);
    this.editandoIds = new Set(this.editandoIds);

    try {
      await firstValueFrom(this.inventarioService.updateProducto(id, payload));
      this.snackBar.open('Producto actualizado correctamente.', 'Cerrar', { duration: 3000 });
      await this.cargarProductos();
    } catch (error) {
      console.error('Error al actualizar producto', error);
      const httpError = error as HttpErrorResponse;
      let mensaje = 'No se pudo actualizar el producto. Intenta nuevamente.';

      if (httpError?.error) {
        if (typeof httpError.error === 'string' && httpError.error.trim()) {
          mensaje = httpError.error;
        } else if (typeof httpError.error?.message === 'string' && httpError.error.message.trim()) {
          mensaje = httpError.error.message;
        }
      }

      this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
    } finally {
      this.editandoIds.delete(id);
      this.editandoIds = new Set(this.editandoIds);
    }
  }

  private normalizarProductos(respuesta: unknown): Producto[] {
    if (Array.isArray(respuesta)) {
      return respuesta as Producto[];
    }

    const contenedor = (respuesta as { productos?: Producto[] })?.productos;
    return Array.isArray(contenedor) ? contenedor : [];
  }

  eliminarProducto(producto: Producto): void {
    const id = this.obtenerIdNumerico(producto);
    if (id === null) {
      return;
    }

    this.eliminandoIds.add(id);
    this.eliminandoIds = new Set(this.eliminandoIds);

    this.inventarioService
      .deleteProducto(id)
      .pipe(
        finalize(() => {
          this.eliminandoIds.delete(id);
          this.eliminandoIds = new Set(this.eliminandoIds);
        })
      )
      .subscribe({
        next: () => {
          const actualizados = this.productosSubject
            .getValue()
            .filter((item) => this.obtenerIdNumerico(item) !== id);
          this.productosSubject.next(actualizados);
        },
        error: () => {
          // Podríamos manejar el error (mostrar notificación, etc.)
        }
      });
  }

  verDetalle(producto: Producto): void {
    const id = this.obtenerIdNumerico(producto);
    if (id === null) {
      return;
    }

    this.dialog.open(DetalleProductoComponent, {
      data: { id },
      width: '640px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'detalle-producto-dialog'
    });
  }

  estaEliminando(producto: Producto): boolean {
    const id = this.obtenerIdNumerico(producto);
    if (id === null) {
      return false;
    }

    return this.eliminandoIds.has(id);
  }

  estaEditando(producto: Producto): boolean {
    const id = this.obtenerIdNumerico(producto);
    if (id === null) {
      return false;
    }

    return this.editandoIds.has(id);
  }

  trackByProducto(_index: number, producto: Producto): number | string {
    return producto.id ?? producto.nombre ?? _index;
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

  private obtenerIdNumerico(producto: Producto): number | null {
    if (producto.id === undefined || producto.id === null) {
      return null;
    }

    const id = Number(producto.id);
    return Number.isNaN(id) ? null : id;
  }
}
