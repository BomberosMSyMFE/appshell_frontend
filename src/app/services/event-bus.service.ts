import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { BomberoDispatchEventDetail } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private dispatchSubject = new Subject<BomberoDispatchEventDetail>();
  public readonly onDispatchEvent$: Observable<BomberoDispatchEventDetail> = this.dispatchSubject.asObservable();

  // Señal reactiva con el último despacho transmitido por el bus
  public ultimoDespacho = signal<BomberoDispatchEventDetail | null>(null);

  constructor() {
    this.iniciarListenerNativo();
  }

  private iniciarListenerNativo(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('BOMBERO_DISPATCH_EVENT', (event: Event) => {
        const customEvent = event as CustomEvent<BomberoDispatchEventDetail>;
        if (customEvent.detail) {
          console.log('[AppShell Native Event Bus] Interceptado BOMBERO_DISPATCH_EVENT:', customEvent.detail);
          this.ultimoDespacho.set(customEvent.detail);
          this.dispatchSubject.next(customEvent.detail);
        }
      });
    }
  }

  /**
   * Emite un evento al bus nativo de la ventana del navegador (desacoplado)
   */
  public emitirEvento(tipo: string, payload: any): void {
    if (typeof window !== 'undefined') {
      const evento = new CustomEvent(tipo, { detail: payload });
      window.dispatchEvent(evento);
    }
  }
}
