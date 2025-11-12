import { Routes } from '@angular/router';
import { PaginaPrincipalComponent } from './componentes/pagina-principal/pagina-principal.component';
import { LoginComponent } from './componentes/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: PaginaPrincipalComponent,
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
