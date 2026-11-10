import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, LoginModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  public modalLoginAbierto = signal<boolean>(false);
  private originalConsoleLog?: typeof console.log;
  private ultimaSincronizacion: Record<string, number> = {};
  private listenersLimpieza: (() => void)[] = [];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    const modoOperacion = environment.useMocks
      ? '[MOCK LOCAL ACTIVO (useMocks: true)]'
      : '[PRODUCCION REAL (useMocks: false)]';

    const estilo = environment.useMocks
      ? 'color: #F59E0B; font-weight: bold; font-family: monospace; font-size: 11px;'
      : 'color: #10B981; font-weight: bold; font-family: monospace; font-size: 11px;';

    console.log(
      `%c=======================================================\n` +
      `SISTEMA BOMBEROS SANTA CRUZ - APP SHELL HOST (:4200)\n` +
      `Modo de Operación: ${modoOperacion}\n` +
      `API MS-01 Comandos: ${environment.apiMs1Url}\n` +
      `MFE-01 Crisis Remoto: ${environment.mfe1CrisisUrl}\n` +
      `MFE-02 Flotas Remoto: ${environment.mfe2FlotasUrl}\n` +
      `MFE-03 Inventario: ${environment.mfe3InventarioUrl}\n` +
      `=======================================================`,
      estilo
    );

    this.iniciarInterceptorTelemetriaFlotas();
  }

  ngOnDestroy(): void {
    if (this.originalConsoleLog) {
      console.log = this.originalConsoleLog;
    }
    this.listenersLimpieza.forEach(unsub => unsub());
    this.listenersLimpieza = [];
  }

  /**
   * Sincroniza de forma inmediata e idempotente cualquier cambio de estado reportado
   * por la cabina o visor de flotas MFE-02 (ej. Llegada a Escena, Fuego Controlado, Fuego Extinguido).
   * Resuelve el incidente correspondiente por su código radial, UUID o camión asignado
   * y persiste el cambio vía PATCH /api/v1/incidentes/{id}/estado en MS-01 DynamoDB.
   */
  public async sincronizarEstadoConMs01(identificador: string, nuevoEstadoRaw: string, camionId?: string): Promise<void> {
    const rawEstado = (nuevoEstadoRaw || '').trim().toUpperCase();
    let estadoMs1: 'EN_COMBATE' | 'CONTROLADO' | 'CERRADO' | null = null;

    if (rawEstado.includes('ESCENA') || rawEstado.includes('LLEGADA') || rawEstado.includes('COMBATE')) {
      estadoMs1 = 'EN_COMBATE';
    } else if (rawEstado.includes('CONTROLAD')) {
      estadoMs1 = 'CONTROLADO';
    } else if (
      rawEstado.includes('EXTINGUID') ||
      rawEstado.includes('DISPONIBL') ||
      rawEstado.includes('LIQUIDAD') ||
      rawEstado.includes('CERRAD')
    ) {
      estadoMs1 = 'CERRADO';
    }

    if (!estadoMs1) return;

    const idCandidato = (identificador || camionId || '').trim();
    if (!idCandidato || idCandidato === 'undefined' || idCandidato === 'null') {
      return;
    }

    // Debounce de 1.5s para evitar ráfagas duplicadas del mismo evento
    const cacheKey = `${idCandidato}_${estadoMs1}`;
    const ahora = Date.now();
    if (this.ultimaSincronizacion[cacheKey] && (ahora - this.ultimaSincronizacion[cacheKey] < 1500)) {
      return;
    }
    this.ultimaSincronizacion[cacheKey] = ahora;

    console.info(`[AppShell Cross-MFE] Sincronizando estado táctico: '${idCandidato}' -> ${estadoMs1}`);

    const isDuckDns = typeof window !== 'undefined' &&
      (window.location.hostname.includes('duckdns.org') || window.location.hostname.includes('bomberos'));
    const origin = isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org' : '';

    // 1. Intentar resolver el siniestro activo si el identificador es un camión
    let idParaPatch = idCandidato;
    try {
      const resp = await fetch(`${origin}/api/v1/incidentes/activos`, { credentials: 'include' });
      if (resp.ok) {
        const activos = await resp.json();
        if (Array.isArray(activos)) {
          const norm = (s: string) => (s || '').toUpperCase().replace(/^CAM-/, '').trim();
          const targetCam = norm(camionId || idCandidato);
          const match = activos.find((inc: any) =>
            inc.id === idCandidato ||
            inc.codigoRadial === idCandidato ||
            inc.codigo === idCandidato ||
            (targetCam && norm(inc.camionAsignado) === targetCam)
          );
          if (match) {
            idParaPatch = match.id || match.codigoRadial || idCandidato;
            console.info(`[AppShell Cross-MFE] Siniestro resuelto para unidad '${targetCam}': ${match.codigoRadial} (${match.id})`);
          }
        }
      }
    } catch (e) {
      console.warn('[AppShell Cross-MFE] Fallback resolución rápida:', e);
    }

    // 2. Ejecutar PATCH /api/v1/incidentes/{id}/estado en MS-01
    const targetUrl = `${origin}/api/v1/incidentes/${encodeURIComponent(idParaPatch)}/estado`;
    fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        nuevoEstado: estadoMs1,
        novedadTexto: `Telemetría táctica MFE-02 Flotas: Unidad '${idCandidato}' reporta estado ${estadoMs1}.`,
      }),
    })
    .then(async res => {
      if (res.ok) {
        console.info(`[AppShell Cross-MFE] [OK] Incidente '${idParaPatch}' persistido exitosamente como ${estadoMs1} en MS-01`);
        window.dispatchEvent(new CustomEvent('BOMBEROS:ESTADO_INCIDENTE_CAMBIADO', {
          detail: { incidenteId: idParaPatch, nuevoEstado: estadoMs1, estado: estadoMs1 }
        }));
      } else {
        console.warn(`[AppShell Cross-MFE] MS-01 respondió HTTP ${res.status} al actualizar '${idParaPatch}'`);
      }
    })
    .catch(err => {
      console.error(`[AppShell Cross-MFE] Error de red al sincronizar con MS-01:`, err);
    });
  }

  /**
   * Registra los interceptores globales de eventos nativos del DOM, postMessage
   * y console.log emitidos por MFE-02 Flotas (React / Cabina PWA).
   */
  private iniciarInterceptorTelemetriaFlotas(): void {
    if (typeof window === 'undefined') return;

    // A. Escucha directa de eventos DOM CustomEvent en window
    const onEstadoIncidente = (e: any) => {
      const d = e.detail || {};
      const id = d.incidenteId || d.camionId;
      const st = d.nuevoEstado || d.estado;
      if (id && st) {
        this.sincronizarEstadoConMs01(id, st, d.camionId);
      }
    };
    window.addEventListener('BOMBEROS:ESTADO_INCIDENTE_CAMBIADO', onEstadoIncidente);
    this.listenersLimpieza.push(() => window.removeEventListener('BOMBEROS:ESTADO_INCIDENTE_CAMBIADO', onEstadoIncidente));

    const onIncidenteControlado = (e: any) => {
      const d = e.detail || {};
      const id = d.incidenteId || d.camionId;
      if (id) {
        this.sincronizarEstadoConMs01(id, 'CONTROLADO', d.camionId);
      }
    };
    window.addEventListener('BOMBEROS:INCIDENTE_CONTROLADO', onIncidenteControlado);
    this.listenersLimpieza.push(() => window.removeEventListener('BOMBEROS:INCIDENTE_CONTROLADO', onIncidenteControlado));

    const onEstadoCamion = (e: any) => {
      const d = e.detail || {};
      const camion = d.camionId;
      const st = d.nuevoEstado;
      if (camion && st) {
        this.sincronizarEstadoConMs01(camion, st, camion);
      }
    };
    window.addEventListener('BOMBEROS:ESTADO_CAMION_CAMBIADO', onEstadoCamion);
    this.listenersLimpieza.push(() => window.removeEventListener('BOMBEROS:ESTADO_CAMION_CAMBIADO', onEstadoCamion));

    const onUnidadLiberada = (e: any) => {
      const d = e.detail || {};
      const camion = d.camionId;
      if (camion) {
        this.sincronizarEstadoConMs01(camion, 'CERRADO', camion);
      }
    };
    window.addEventListener('BOMBEROS:UNIDAD_LIBERADA', onUnidadLiberada);
    this.listenersLimpieza.push(() => window.removeEventListener('BOMBEROS:UNIDAD_LIBERADA', onUnidadLiberada));

    // B. Escucha de mensajes postMessage (cross-iframe)
    const onMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (data && typeof data === 'object') {
          if (data.type === 'BOMBEROS:ESTADO_INCIDENTE_CAMBIADO' || data.event === 'BOMBEROS:ESTADO_INCIDENTE_CAMBIADO') {
            const d = data.detail || data.payload || data;
            const id = d.incidenteId || d.camionId;
            const st = d.nuevoEstado || d.estado;
            if (id && st) this.sincronizarEstadoConMs01(id, st, d.camionId);
          } else if (data.type === 'BOMBEROS:ESTADO_CAMION_CAMBIADO' || data.event === 'BOMBEROS:ESTADO_CAMION_CAMBIADO') {
            const d = data.detail || data.payload || data;
            if (d.camionId && d.nuevoEstado) this.sincronizarEstadoConMs01(d.camionId, d.nuevoEstado, d.camionId);
          }
        }
      } catch {}
    };
    window.addEventListener('message', onMessage);
    this.listenersLimpieza.push(() => window.removeEventListener('message', onMessage));

    // C. Interceptor de fallback sobre console.log
    this.originalConsoleLog = console.log;
    const selfOriginalLog = this.originalConsoleLog;

    console.log = (...args: any[]) => {
      try {
        selfOriginalLog.apply(console, args);
      } catch {}

      try {
        const fullMsg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        if (fullMsg.includes('Evento de Incidente:')) {
          const match = fullMsg.match(/Evento de Incidente:\s*([^\s->]+)\s*->\s*([A-Za-z0-9_-]+)/i);
          if (match) {
            const rawId = match[1].trim();
            const rawEstado = match[2].trim();
            this.sincronizarEstadoConMs01(rawId, rawEstado);
          }
        }
      } catch {}
    };
  }
}

