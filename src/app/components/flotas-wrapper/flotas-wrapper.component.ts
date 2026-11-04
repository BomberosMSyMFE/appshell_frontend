import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { environment } from '../../../environments/environment';
import { RemoteFallbackComponent } from '../remote-fallback/remote-fallback.component';

@Component({
  selector: 'app-flotas-wrapper',
  standalone: true,
  imports: [CommonModule, RemoteFallbackComponent],
  template: `
    <div *ngIf="cargando" class="loading-state">
      <i class="bi bi-arrow-repeat spin-icon"></i>
      <span>Conectando con Microfrontend MFE2 (React 18 / Maikol)...</span>
    </div>

    <!-- Si el remoto está fuera de línea, se renderiza el Fallback sin romper el Shell -->
    <app-remote-fallback
      *ngIf="errorCarga"
      [remoteName]="'MFE2 - Visor Cartográfico y Telemetría de Flotas'"
      [port]="4202"
      [framework]="'React 18 (Leaflet / Mapbox)'"
      [responsable]="'Maikol Molina (INF512)'"
    ></app-remote-fallback>

    <!-- Contenedor Isla del DOM Real para React -->
    <div id="isla-mapa-react" class="react-container" [hidden]="errorCarga || cargando"></div>
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
    .react-container { min-height: 500px; width: 100%; }
  `]
})
export class FlotasWrapperComponent implements OnInit {
  public cargando = true;
  public errorCarga = false;

  async ngOnInit() {
    try {
      const module = await loadRemoteModule({
        type: 'script',
        remoteName: 'mfe2_flotas_frontend',
        remoteEntry: environment.mfe2FlotasUrl,
        exposedModule: './VisorCartografico'
      });
      this.cargando = false;
      // Montar componente React en #isla-mapa-react si está disponible
      if (module && typeof module.mount === 'function') {
        const rootEl = document.getElementById('isla-mapa-react');
        if (rootEl) module.mount(rootEl);
      }
    } catch (err) {
      console.warn('[AppShell] MFE2 Flotas (React) no está activo en puerto 4202. Mostrando fallback contenido.', err);
      this.cargando = false;
      this.errorCarga = true;
    }
  }
}
