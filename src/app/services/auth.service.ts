import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User, LoginResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiMs1Url}/auth`;
  private readonly storageKey = 'BOMBEROS_SSO_USER';

  public currentUser = signal<User | null>(null);
  public isLoading = signal<boolean>(false);
  public isAuthenticated = computed(() => this.currentUser() !== null);

  constructor(private http: HttpClient) {
    this.restaurarSesionLocal();
  }

  private restaurarSesionLocal(): void {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        this.currentUser.set(JSON.parse(stored));
      } else {
        this.currentUser.set(null);
      }
    } catch {
      this.currentUser.set(null);
    }
  }

  /**
   * Inicio de sesión SSO con propagación de cookies HttpOnly
   */
  public login(email: string, password: string): Observable<User> {
    this.isLoading.set(true);

    const isBomberoEmail = email.toLowerCase().includes('bombero');

    if (environment.useMocks) {
      console.warn('[DEV-AUDIT AUTH] MODO MOCK ACTIVO: Autenticando con usuario sintético local.');
      const mockUser: User = {
        id: isBomberoEmail ? 'usr_bombero_01' : 'USR-NAT-01',
        email,
        nombre: isBomberoEmail ? 'Sargento B-01 (Bombero Operativo)' : 'Nataly Martínez',
        nombreCompleto: isBomberoEmail ? 'Sargento B-01 (Bombero Operativo)' : 'Nataly Martínez',
        rol: isBomberoEmail ? 'BOMBERO' : 'OPERADOR',
        estacion: 'Estación Central - Santa Cruz',
        estacionBase: 'Estación Central - Santa Cruz',
        telefonoMovil: isBomberoEmail ? '+591 70020001' : '+591 70012345'
      };
      this.establecerUsuario(mockUser);
      this.isLoading.set(false);
      return of(mockUser);
    }

    console.log('[DEV-AUDIT AUTH] LLAMANDO ENDPOINT REAL: POST ' + this.baseUrl + '/login');

    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      map(res => {
        const rawUser = res.usuario || res.user;
        const user: User = rawUser ? {
          id: rawUser.id,
          email: rawUser.email || email,
          nombre: rawUser.nombreCompleto || rawUser.nombre || email.split('@')[0].toUpperCase(),
          nombreCompleto: rawUser.nombreCompleto || rawUser.nombre,
          rol: rawUser.rol || (isBomberoEmail ? 'BOMBERO' : 'OPERADOR'),
          estacion: rawUser.estacionBase || rawUser.estacion || 'Estación Central - Santa Cruz',
          estacionBase: rawUser.estacionBase || rawUser.estacion,
          telefonoMovil: rawUser.telefonoMovil || ''
        } : {
          id: isBomberoEmail ? 'usr_bombero_01' : ('USR-' + Math.floor(100 + Math.random() * 900)),
          email,
          nombre: isBomberoEmail ? 'Sargento B-01 (Bombero Operativo)' : email.split('@')[0].toUpperCase(),
          nombreCompleto: isBomberoEmail ? 'Sargento B-01 (Bombero Operativo)' : email.split('@')[0].toUpperCase(),
          rol: isBomberoEmail ? 'BOMBERO' : 'OPERADOR',
          estacion: 'Estación Central - Santa Cruz',
          estacionBase: 'Estación Central - Santa Cruz',
          telefonoMovil: isBomberoEmail ? '+591 70020001' : ''
        };
        console.log('[DEV-AUDIT AUTH] Sesion iniciada con exito en MS-01 real. Usuario: ' + user.email + ' (Rol: ' + user.rol + ')');
        this.establecerUsuario(user);
        this.isLoading.set(false);
        return user;
      }),
      catchError(err => {
        this.isLoading.set(false);
        console.error('[DEV-AUDIT AUTH ERROR] Fallo HTTP ' + err.status + ' al autenticar en MS-01 real (' + this.baseUrl + '/login).');

        if (environment.useMocks) {
          console.group(
            '%c DEV-AUDIT AUTH %c Modo Mock Activo (' + this.baseUrl + '/login)',
            'background: #D97706; color: #FFFFFF; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 3px;',
            'color: #F59E0B; font-weight: bold; font-size: 11px;'
          );
          console.warn('• Acción: Activando sesión mock local.');
          console.groupEnd();
          const mockUser: User = {
            id: isBomberoEmail ? 'usr_bombero_01' : 'USR-NAT-01',
            email,
            nombre: isBomberoEmail ? 'Sargento B-01 (Bombero Operativo)' : 'Nataly Martínez',
            nombreCompleto: isBomberoEmail ? 'Sargento B-01 (Bombero Operativo)' : 'Nataly Martínez',
            rol: isBomberoEmail ? 'BOMBERO' : 'OPERADOR',
            estacion: 'Estación Central - Santa Cruz',
            estacionBase: 'Estación Central - Santa Cruz',
            telefonoMovil: isBomberoEmail ? '+591 70020001' : '+591 70012345'
          };
          this.establecerUsuario(mockUser);
          return of(mockUser);
        }

        const msg = err.status === 0
          ? 'No se pudo conectar con el servidor de autenticación MS-01. Verifique que el servicio esté iniciado en el puerto 3000.'
          : (err.error?.mensaje || err.error?.message || 'Credenciales inválidas. Verifique su correo y contraseña táctica.');
        return throwError(() => new Error(msg));
      })
    );
  }

  /**
   * Cierre de sesión y limpieza de contexto SSO
   */
  public logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {},
      error: () => {}
    });

    this.currentUser.set(null);
    try {
      sessionStorage.removeItem(this.storageKey);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('BOMBERO_AUTH_CHANGE', { detail: null }));
      }
    } catch {}
  }

  public establecerUsuario(user: User): void {
    this.currentUser.set(user);
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(user));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('BOMBERO_AUTH_CHANGE', { detail: user }));
      }
    } catch {}
  }
}
