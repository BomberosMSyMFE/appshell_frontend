import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { environment } from '../environments/environment';
import { CrisisFallbackComponent } from './components/crisis-fallback/crisis-fallback.component';
import { FlotasWrapperComponent } from './components/flotas-wrapper/flotas-wrapper.component';
import { InventarioWrapperComponent } from './components/inventario-wrapper/inventario-wrapper.component';

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
        type: 'module',
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
    path: '**',
    redirectTo: 'crisis'
  }
];
