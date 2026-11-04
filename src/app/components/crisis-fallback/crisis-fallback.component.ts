import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemoteFallbackComponent } from '../remote-fallback/remote-fallback.component';

@Component({
  selector: 'app-crisis-fallback',
  standalone: true,
  imports: [CommonModule, RemoteFallbackComponent],
  template: `
    <app-remote-fallback
      [remoteName]="'MFE1 - Consola de Comandos y Sala de Crisis'"
      [port]="4201"
      [framework]="'Angular 18 (RxJS, WebSockets, SAGA Human-in-the-Loop)'"
      [responsable]="'Nataly Martínez (Líder / Fullstack INF512)'"
    ></app-remote-fallback>
  `
})
export class CrisisFallbackComponent {}
