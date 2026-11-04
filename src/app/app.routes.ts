import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { environment } from '../environments/environment';
import { CrisisFallbackComponent } from './components/crisis-fallback/crisis-fallback.component';
import { FlotasWrapperComponent } from './components/flotas-wrapper/flotas-wrapper.component';
import { InventarioWrapperComponent } from './components/inventario-wrapper/inventario-wrapper.component';
import { ReportesShellComponent } from './components/reportes-shell/reportes-shell.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'crisis',
    pathMatch: 'full'
  },
  {
    path: 'crisis',
    loadComponent: () =>
      loadRemoteModule({
        type: 'script',
        remoteName: 'mfe1_comandos_frontend',
        remoteEntry: environment.mfe1CrisisUrl,
        exposedModule: './Component'
      })
      .then(m => m.CrisisRoomComponent || m.AppComponent)
      .catch(err => {
        console.warn('[AppShell] Remote mfe1_comandos_frontend no disponible. Montando fallback protegido:', err);
        return CrisisFallbackComponent;
      })
  },
  {
    path: 'flotas',
    component: FlotasWrapperComponent
  },
  {
    path: 'inventario',
    component: InventarioWrapperComponent
  },
  {
    path: 'reportes',
    loadComponent: () =>
      loadRemoteModule({
        type: 'script',
        remoteName: 'mfe1_comandos_frontend',
        remoteEntry: environment.mfe1CrisisUrl,
        exposedModule: './Reportes'
      })
      .then(m => m.ReportesComponent)
      .catch(err => {
        console.warn('[AppShell] Remote mfe1_comandos_frontend (Reportes) no disponible. Montando fallback contingente:', err);
        return ReportesShellComponent;
      })
  },
  {
    path: '**',
    redirectTo: 'crisis'
  }
];
