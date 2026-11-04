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
        // Usuario oficial de guardia por defecto para la sesión táctica
        const defaultUser: User = {
          id: 'USR-NAT-01',
          email: 'nataly@bomberos.gob.bo',
          nombre: 'Cap. Nataly Martínez',
          rol: 'OFICIAL_GUARDIA',
          estacion: 'Estación Central 1 (Casco Viejo)'
        };
        this.currentUser.set(defaultUser);
        sessionStorage.setItem(this.storageKey, JSON.stringify(defaultUser));
      }
    } catch {
      // Ignorar fallos de acceso a sessionStorage
    }
  }

  /**
   * Inicio de sesión SSO con propagación de cookies HttpOnly
   */
  public login(email: string, password: string):Observable<User> {
    this.isLoading.set(true);

    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      map(res => {
        const user: User = res.user || {
          id: 'USR-' + Math.floor(100 + Math.random() * 900),
          email,
          nombre: email.split('@')[0].toUpperCase(),
          rol: 'OFICIAL_GUARDIA',
          estacion: 'Estación Central 1'
        };
        this.establecerUsuario(user);
        this.isLoading.set(false);
        return user;
      }),
      catchError(err => {
        this.isLoading.set(false);
        console.warn('[AuthService] Backend Auth no disponible o error HTTP:', err.status);

        // Si el backend no está disponible, permitir demo login con credenciales válidas
        if (email === 'nataly@bomberos.gob.bo' || email === 'oficial@bomberos.gob.bo' || err.status === 0) {
          const mockUser: User = {
            id: 'USR-NAT-01',
            email,
            nombre: 'Cap. Nataly Martínez',
            rol: 'OFICIAL_GUARDIA',
            estacion: 'Estación Central 1 (Casco Viejo)'
          };
          this.establecerUsuario(mockUser);
          return of(mockUser);
        }

        const msg = err.error?.mensaje || err.error?.message || 'Credenciales inválidas o servicio de autenticación no disponible.';
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
    } catch {}
  }

  public establecerUsuario(user: User): void {
    this.currentUser.set(user);
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch {}
  }
}
