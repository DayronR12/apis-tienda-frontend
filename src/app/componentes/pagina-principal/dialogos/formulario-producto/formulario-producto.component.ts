import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CrearProductoPayload, Producto } from '../../../../servicios/inventario.service';

interface FormularioProductoData {
  titulo?: string;
  descripcion?: string;
  confirmLabel?: string;
  producto?: Partial<Producto>;
}

@Component({
  selector: 'app-formulario-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './formulario-producto.component.html',
  styleUrl: './formulario-producto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormularioProductoComponent {
  private readonly dialogRef = inject(MatDialogRef<FormularioProductoComponent>);
  private readonly datosDialogo = inject<FormularioProductoData | null>(MAT_DIALOG_DATA, {
    optional: true
  }) ?? {};
  private readonly fb = inject(FormBuilder);

  readonly titulo = this.datosDialogo.titulo ?? 'Agregar producto';
  readonly descripcion =
    this.datosDialogo.descripcion ?? 'Completa la información para registrar un nuevo artículo.';
  readonly confirmLabel = this.datosDialogo.confirmLabel ?? 'Guardar';
  private readonly productoInicial = this.datosDialogo.producto ?? {};

  readonly formulario = this.fb.group({
    nombre: this.fb.control(this.productoInicial.nombre ?? '', {
      validators: [Validators.required, Validators.minLength(3)]
    }),
    marca: this.fb.control(this.productoInicial.marca ?? '', {
      validators: [Validators.required, Validators.minLength(2)]
    }),
    cantidad: this.fb.control<number | null>(this.productoInicial.cantidad ?? null, {
      validators: [Validators.required, Validators.min(0)]
    }),
    precio: this.fb.control<number | null>(
      this.productoInicial.precio !== undefined && this.productoInicial.precio !== null
        ? Number(this.productoInicial.precio)
        : null,
      {
        validators: [Validators.required, Validators.min(0)]
      }
    ),
    categoria_id: this.fb.control<number | null>(
      this.productoInicial.categoria_id ?? null,
      {
        validators: [Validators.min(1)]
      }
    )
  });

  get controles() {
    return this.formulario.controls;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombre, marca, cantidad, precio, categoria_id } = this.formulario.getRawValue();
    const cantidadNumerica = Number(cantidad);
    const precioNumerico = Number(precio);

    const payload: CrearProductoPayload = {
      nombre: (nombre ?? '').trim(),
      marca: (marca ?? '').trim(),
      cantidad: Number.isNaN(cantidadNumerica) ? 0 : cantidadNumerica,
      precio: Number.isNaN(precioNumerico) ? 0 : precioNumerico
    };

    if (categoria_id !== undefined && categoria_id !== null) {
      payload.categoria_id = Number(categoria_id);
    }

    this.dialogRef.close(payload);
  }
}
