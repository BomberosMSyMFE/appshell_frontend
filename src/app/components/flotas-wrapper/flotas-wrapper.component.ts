import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { environment } from '../../../environments/environment';
import { RemoteFallbackComponent } from '../remote-fallback/remote-fallback.component';

@Component({
  selector: 'app-flotas-wrapper',
  standalone: true,
  imports: [CommonModule, RemoteFallbackComponent],
  template: `
    <!-- Barra de Sub-Navegación Táctica para MFE-02 (Maikol Molina / GCP) -->
    <div class="flotas-subnav">
      <div class="subnav-left">
        <span class="subnav-title">
          <i class="bi bi-truck-front-fill text-warning"></i>
          MFE-02 TELEMETRÍA Y RUTAS (GCP)
        </span>
        <div class="btn-group-views">
          <button
            class="btn-tab"
            [class.active]="vistaActiva === 'visor'"
            (click)="cambiarVista('visor')"
          >
            <i class="bi bi-geo-alt-fill"></i>
            Visor Cartográfico GIS
          </button>
          <button
            class="btn-tab"
            [class.active]="vistaActiva === 'cabina'"
            (click)="cambiarVista('cabina')"
          >
            <i class="bi bi-phone-fill"></i>
            Terminal Cabina PWA
          </button>
        </div>
      </div>
      <div class="subnav-right">
        <span class="badge-node">
          <span class="status-dot"></span>
          Nodo GCP: 34.28.212.45 (:4202 / :8082)
        </span>
      </div>
    </div>

    <!-- Indicador de Carga -->
    <div *ngIf="cargando && vistaActiva === 'visor'" class="loading-state">
      <i class="bi bi-arrow-repeat spin-icon"></i>
      <span>Conectando con Microfrontend MFE2 (React 18 / Maikol)...</span>
    </div>

    <!-- Fallback si GCP está fuera de línea -->
    <app-remote-fallback
      *ngIf="errorCarga && vistaActiva === 'visor'"
      [remoteName]="'MFE2 - Visor Cartográfico y Telemetría de Flotas'"
      [port]="4202"
      [framework]="'React 18 (Leaflet / Spring Boot MS-02)'"
      [responsable]="'Maikol Molina (INF512)'"
    ></app-remote-fallback>

    <!-- Vista 1: Visor Cartográfico Táctico (React 18 Montado en Isla DOM) -->
    <div
      *ngIf="vistaActiva === 'visor'"
      id="isla-mapa-react"
      class="react-container"
      [hidden]="errorCarga || cargando"
    ></div>

    <!-- Vista 2: Terminal de Cabina PWA (Móvil / Web) -->
    <div *ngIf="vistaActiva === 'cabina'" class="cabina-container">
      <iframe
        [src]="cabinaPwaUrl"
        class="cabina-iframe"
        title="Terminal de Cabina Bombero PWA"
        allow="geolocation; camera; microphone"
        (load)="onIframeLoad($event)"
      ></iframe>
    </div>
  `,
  styles: [`
    .flotas-subnav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background: #111827;
      border-bottom: 1px solid #1F2937;
      color: #F3F4F6;
    }
    .subnav-left {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .subnav-title {
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #9CA3AF;
    }
    .btn-group-views {
      display: flex;
      background: #1F2937;
      padding: 3px;
      border-radius: 6px;
      gap: 4px;
    }
    .btn-tab {
      background: transparent;
      border: none;
      color: #9CA3AF;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease-in-out;
    }
    .btn-tab:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.05);
    }
    .btn-tab.active {
      background: #DC2626;
      color: #FFFFFF;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    .subnav-right {
      display: flex;
      align-items: center;
    }
    .badge-node {
      font-size: 11px;
      font-family: monospace;
      background: rgba(16, 185, 129, 0.1);
      color: #10B981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 10px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 6px #10B981;
    }
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
    .react-container { 
      height: calc(100vh - 120px);
      min-height: 600px;
      width: 100%;
      background: #0A0E17;
      position: relative;
    }
    :host ::ng-deep .leaflet-container {
      width: 100% !important;
      height: 100% !important;
      background-color: #0A0E17 !important;
    }
    .cabina-container {
      width: 100%;
      height: calc(100vh - 110px);
      background: #0A0E17;
    }
    .cabina-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    @media (max-width: 768px) {
      .flotas-subnav {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        padding: 8px 12px;
      }
      .subnav-left {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        width: 100%;
      }
      .subnav-title {
        font-size: 11px;
      }
      .btn-group-views {
        width: 100%;
        display: flex;
      }
      .btn-tab {
        flex: 1;
        justify-content: center;
        padding: 8px 10px;
        font-size: 11px;
      }
      .subnav-right {
        justify-content: flex-end;
      }
      .badge-node {
        font-size: 9.5px;
        padding: 2px 6px;
      }
      .react-container {
        height: calc(100vh - 140px);
        min-height: 420px;
      }
      .cabina-container {
        height: calc(100vh - 140px);
      }
    }
  `]
})
export class FlotasWrapperComponent implements OnInit, OnDestroy {
  public vistaActiva: 'visor' | 'cabina' = 'visor';
  public cargando = true;
  public errorCarga = false;
  public cabinaPwaUrl: SafeResourceUrl;
  private unmountCallback?: () => void;

  // Referencias estables e inmutables de longitud cero
  // Permiten que VisorCartografico consulte dinámicamente en vivo el backend de Maikol en GCP (/api/v1/flotas/unidades/activas)
  // recuperando cualquier cantidad de unidades (5, 10, 20 o más),
  // a la vez que evitan la creación de nuevas instancias en memoria para erradicar el bucle infinito de dependencias de React.
  private static readonly STABLE_EMPTY_UNIDADES: any[] = Object.freeze([]) as unknown as any[];
  private static readonly STABLE_EMPTY_HIDRANTES: any[] = Object.freeze([]) as unknown as any[];
  private static readonly STABLE_EMPTY_HOTSPOTS: any[] = Object.freeze([]) as unknown as any[];

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    const isDuckDns = typeof window !== 'undefined' &&
      (window.location.hostname.includes('duckdns.org') || window.location.hostname.includes('bomberos'));
    const origin = isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org' : '';
    const rawUrl = `${origin}/mfe2/`;
    this.cabinaPwaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  async ngOnInit() {
    this.asegurarEstilosLeaflet();
    await this.montarVisorReact();
  }

  private asegurarEstilosLeaflet(): void {
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-cdn-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }

  public async cambiarVista(nuevaVista: 'visor' | 'cabina') {
    if (this.vistaActiva === nuevaVista) return;
    this.vistaActiva = nuevaVista;

    if (nuevaVista === 'visor') {
      setTimeout(() => this.montarVisorReact(), 50);
    } else {
      this.desmontarVisorReact();
    }
  }

  private async montarVisorReact() {
    this.cargando = true;
    this.errorCarga = false;
    this.cdr.detectChanges();

    // Inyectar variables globales esperadas por MFE-02 Flotas (Maikol)
    if (typeof window !== 'undefined') {
      const isDuckDns = window.location.hostname.includes('duckdns.org') || window.location.hostname.includes('bomberos');
      const origin = isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org' : '';
      (window as any).__FLOTAS_API_URL__ = `${origin}/api/v1/flotas`;
      (window as any).MCP_BASE_URL = `${origin}/api/v1/mcp`;
      (window as any).__MCP_BASE_URL__ = `${origin}/api/v1/mcp`;
    }

    try {
      const module = await loadRemoteModule({
        type: 'script',
        remoteName: 'mfe2_flotas_frontend',
        remoteEntry: environment.mfe2FlotasUrl,
        exposedModule: './VisorCartografico'
      });

      this.cargando = false;
      this.cdr.detectChanges();

      // Consultar en vivo los incidentes activos desde MS-01 para alimentar el mapa de MFE-02 con todos los siniestros reales y sus ubicaciones
      const isDuckDns = window.location.hostname.includes('duckdns.org') || window.location.hostname.includes('bomberos');
      const origin = isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org' : '';
      let incidentesMapeados: any[] = [];
      try {
        const resp = await fetch(`${origin}/api/v1/incidentes/activos`).then(r => r.json());
        if (Array.isArray(resp)) {
          incidentesMapeados = resp.map(inc => ({
            id: inc.id,
            incidenteId: inc.codigoRadial || inc.codigo || inc.id,
            codigoRadial: inc.codigoRadial || inc.codigo || inc.id,
            titulo: inc.descripcion || inc.titulo || 'Emergencia Táctica',
            direccion: inc.ubicacion?.dir || inc.direccion || 'Santa Cruz',
            ubicacion: inc.ubicacion?.dir || inc.direccion || 'Santa Cruz',
            tipoFuego: inc.tipoIncidente || inc.tipo || 'ESTRUCTURAL',
            latitud: inc.ubicacion?.lat || inc.latitud || -17.7833,
            longitud: inc.ubicacion?.lng || inc.longitud || -63.1821,
            prioridad: inc.severidad === 'CRITICA' || inc.nivelRiesgo === 'CRITICO' ? 'CODIGO_ROJO' : 'CODIGO_AMARILLO',
            camionSugeridoId: inc.camionAsignado || null,
          }));
        }
      } catch (e) {
        console.warn('[FlotasWrapper] No se pudo obtener lista de incidentes activos:', e);
      }

      // Montar componente React pasando referencias de datos estables para evitar el bucle infinito en MFE2
      if (module && typeof module.mount === 'function') {
        const rootEl = document.getElementById('isla-mapa-react');
        if (rootEl) {
          const notificarCambio = (incId: any, est: any, camId?: any) => {
            console.log(`[FlotasWrapper -> Bus] Notificando cambio cross-MFE: ${incId} -> ${est} (Camión: ${camId})`);
            window.dispatchEvent(new CustomEvent('BOMBEROS:ESTADO_INCIDENTE_CAMBIADO', {
              detail: { incidenteId: incId, nuevoEstado: est, camionId: camId }
            }));
          };

          const propsEstables = {
            incidentes: incidentesMapeados,
            unidades: FlotasWrapperComponent.STABLE_EMPTY_UNIDADES,
            hidrantes: FlotasWrapperComponent.STABLE_EMPTY_HIDRANTES,
            hotspots: FlotasWrapperComponent.STABLE_EMPTY_HOTSPOTS,
            onCamionClick: (camion: any) => {
              console.log('[AppShell] Camión seleccionado en MFE2:', camion);
            },
            onTrazarRuta: (camionId: string) => {
              console.log('[AppShell] Trazar ruta óptima para camión:', camionId);
            },
            onIncidenteCambio: notificarCambio,
            onEstadoIncidente: notificarCambio,
            onCambioEstado: notificarCambio,
            onIncidenteControlado: (incId: any, camId?: any) => notificarCambio(incId, 'CONTROLADO', camId),
            onIncidenteExtinguido: (incId: any, camId?: any) => notificarCambio(incId, 'EXTINGUIDO', camId),
            onEventoIncidente: notificarCambio,
          };

          const res = module.mount(rootEl, propsEstables);
          if (typeof res === 'function') {
            this.unmountCallback = res;
          }

          // Disparar redimensionamiento escalonado para recalcular los tiles de OpenStreetMap
          [100, 300, 600, 1200].forEach(delay => {
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
            }, delay);
          });
        }
      }
    } catch (err) {
      console.warn('[AppShell] MFE2 Flotas (React) no disponible:', err);
      this.cargando = false;
      this.errorCarga = true;
      this.cdr.detectChanges();
    }
  }

  private desmontarVisorReact() {
    if (typeof this.unmountCallback === 'function') {
      try {
        this.unmountCallback();
      } catch (e) {
        console.warn('[FlotasWrapper] Error al desmontar instancia React:', e);
      }
      this.unmountCallback = undefined;
    }
    const rootEl = document.getElementById('isla-mapa-react');
    if (rootEl) {
      rootEl.innerHTML = '';
    }
  }

  /**
   * Conecta un puente bidireccional entre la Terminal de Cabina PWA (iframe) y el AppShell.
   * Al estar en el mismo origen (/mfe2/ bajo proxy en el mismo dominio), captura todos los
   * eventos tácticos de los botones ('Llegada a Escena', 'Fuego Controlado', 'Extinguido')
   * y los re-despacha a nivel de window principal para sincronizarlos de inmediato con MS-01.
   */
  public onIframeLoad(event: Event): void {
    try {
      const iframe = event.target as HTMLIFrameElement;
      const iframeWin = iframe?.contentWindow;
      if (!iframeWin) return;

      console.info('[FlotasWrapper] Puente táctico conectado con Terminal de Cabina PWA (iframe)');

      const reenviarEvento = (tipoEvento: string, detail: any) => {
        console.info(`[FlotasWrapper Puente] Evento capturado en iframe: ${tipoEvento}`, detail);
        window.dispatchEvent(new CustomEvent(tipoEvento, { detail }));
      };

      iframeWin.addEventListener('BOMBEROS:ESTADO_INCIDENTE_CAMBIADO', (e: any) => {
        reenviarEvento('BOMBEROS:ESTADO_INCIDENTE_CAMBIADO', e.detail);
      });
      iframeWin.addEventListener('BOMBEROS:INCIDENTE_CONTROLADO', (e: any) => {
        reenviarEvento('BOMBEROS:INCIDENTE_CONTROLADO', e.detail);
      });
      iframeWin.addEventListener('BOMBEROS:ESTADO_CAMION_CAMBIADO', (e: any) => {
        reenviarEvento('BOMBEROS:ESTADO_CAMION_CAMBIADO', e.detail);
      });
      iframeWin.addEventListener('BOMBEROS:UNIDAD_LIBERADA', (e: any) => {
        reenviarEvento('BOMBEROS:UNIDAD_LIBERADA', e.detail);
      });

      // Propagar logs de consola desde el iframe hacia la ventana principal
      const winAny = iframeWin as any;
      if (winAny && winAny.console) {
        const iframeOriginalLog = winAny.console.log;
        winAny.console.log = (...args: any[]) => {
          try { iframeOriginalLog.apply(winAny.console, args); } catch {}
          try { window.console.log(...args); } catch {}
        };
      }
    } catch (err) {
      console.warn('[FlotasWrapper] Error al adjuntar puente táctico al iframe:', err);
    }
  }

  ngOnDestroy(): void {
    this.desmontarVisorReact();
  }
}
