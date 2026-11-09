import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RemoteFallbackComponent } from '../remote-fallback/remote-fallback.component';

@Component({
  selector: 'app-inventario-wrapper',
  standalone: true,
  imports: [CommonModule, RemoteFallbackComponent],
  template: `
    <!-- Barra Táctica de Estado para MFE-03 (Jael Sandoval / Render) -->
    <div class="inventario-subnav">
      <div class="subnav-left">
        <span class="subnav-title">
          <i class="bi bi-box-seam-fill text-info"></i>
          MFE-03 CATÁLOGO E INVENTARIO DE INSUMOS
        </span>
        <span class="subnav-framework">
          Vue 3 + Apollo GraphQL
        </span>
      </div>
      <div class="subnav-right">
        <span class="badge-node">
          <span class="status-dot"></span>
          Nodo Jael Sandoval (Render / Supabase Cloud)
        </span>
      </div>
    </div>

    <!-- Indicador de Carga Inicial -->
    <div *ngIf="cargando" class="loading-state">
      <i class="bi bi-arrow-repeat spin-icon"></i>
      <span>Conectando con Microfrontend MFE3 (Vue 3 / Jael Sandoval)...</span>
    </div>

    <!-- Fallback si el servicio remoto está caído -->
    <app-remote-fallback
      *ngIf="errorCarga"
      [remoteName]="'MFE3 - Catálogo e Inventario de Insumos (GraphQL)'"
      [port]="3003"
      [framework]="'Vue 3 (Apollo GraphQL / MS-03)'"
      [responsable]="'Jael Sandoval (INF512)'"
    ></app-remote-fallback>

    <!-- Contenedor Embebido de Alta Definición para MFE-03 -->
    <div class="inventario-container" [hidden]="errorCarga">
      <iframe
        [src]="inventarioUrl"
        class="inventario-iframe"
        title="Catálogo e Inventario de Insumos MFE-03"
        (load)="onIframeLoad()"
        (error)="onIframeError()"
        allow="clipboard-read; clipboard-write"
      ></iframe>
    </div>
  `,
  styles: [`
    .inventario-subnav {
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
      gap: 14px;
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
    .subnav-framework {
      font-size: 11px;
      background: #1F2937;
      color: #60A5FA;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 600;
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
    .inventario-container {
      width: 100%;
      height: calc(100vh - 110px);
      background: #0A0E17;
    }
    .inventario-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  `]
})
export class InventarioWrapperComponent implements OnInit {
  public cargando = true;
  public errorCarga = false;
  public inventarioUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    // Render aloja directamente la SPA de Vue 3 / Vite de Jael Sandoval
    const rawUrl = 'https://mfe3-inventario-frontend.onrender.com/';
    this.inventarioUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  ngOnInit() {
    // Timeout de seguridad en caso de fallo de red
    setTimeout(() => {
      if (this.cargando) {
        this.cargando = false;
      }
    }, 4000);
  }

  onIframeLoad() {
    this.cargando = false;
    this.errorCarga = false;
  }

  onIframeError() {
    this.cargando = false;
    this.errorCarga = true;
  }
}
