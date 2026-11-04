import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { environment } from '../../../environments/environment';
import { RemoteFallbackComponent } from '../remote-fallback/remote-fallback.component';

@Component({
  selector: 'app-inventario-wrapper',
  standalone: true,
  imports: [CommonModule, RemoteFallbackComponent],
  template: `
    <div *ngIf="cargando" class="loading-state">
      <i class="bi bi-arrow-repeat spin-icon"></i>
      <span>Conectando con Microfrontend MFE3 (Vue 3 / Jael)...</span>
    </div>

    <!-- Si el remoto está fuera de línea, se renderiza el Fallback sin romper el Shell -->
    <app-remote-fallback
      *ngIf="errorCarga"
      [remoteName]="'MFE3 - Catálogo e Inventario de Insumos (GraphQL)'"
      [port]="4203"
      [framework]="'Vue 3 (Apollo GraphQL / Laravel MS-03)'"
      [responsable]="'Jael Sandoval (INF512)'"
    ></app-remote-fallback>

    <!-- Contenedor Isla del DOM Real para Vue -->
    <div id="isla-inventario-vue" class="vue-container" [hidden]="errorCarga || cargando"></div>
  `,
  styles: [`
    .loading-state {
      padding: 60px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .spin-icon {
      font-size: 32px;
      color: var(--color-primary);
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .vue-container { min-height: 500px; width: 100%; }
  `]
})
export class InventarioWrapperComponent implements OnInit {
  public cargando = true;
  public errorCarga = false;

  async ngOnInit() {
    try {
      const module = await loadRemoteModule({
        type: 'script',
        remoteName: 'mfe3_inventario_frontend',
        remoteEntry: environment.mfe3InventarioUrl,
        exposedModule: './CatalogoInsumos'
      });
      this.cargando = false;
      // Montar componente Vue en #isla-inventario-vue si está disponible
      if (module && typeof module.mount === 'function') {
        const rootEl = document.getElementById('isla-inventario-vue');
        if (rootEl) module.mount(rootEl);
      }
    } catch (err) {
      console.warn('[AppShell] MFE3 Inventario (Vue) no está activo en puerto 4203. Mostrando fallback contenido.', err);
      this.cargando = false;
      this.errorCarga = true;
    }
  }
}
