# Guía de Arquitectura y Archivos Clave — `appshell_frontend`

**Plataforma Distribuida para el Cuerpo de Bomberos — INF512 (Ingeniería de Software II)**  
**Semestre:** 2/2026 — UAGRM  
**Docente:** M.Sc. Ing. Rolando Antonio Martinez Canedo  
**Responsable:** Nataly Martínez (Líder / Fullstack)  
**Rol:** Host Anfitrión Federado (Puerto `4200`)

---

## 1. Visión General de la Arquitectura del Host

El repositorio **`appshell_frontend`** implementa el patrón **Host Anfitrión** de Microfrontends mediante **Angular 18 Standalone** y **Webpack 5 Module Federation**. Su función principal es actuar como orquestador en runtime:
* Provee la navegación global (`NavbarComponent`) y la identidad visual institucional.
* Gestiona la sesión única de usuario (SSO) mediante cookies `HttpOnly` (`withCredentials: true`).
* Carga bajo demanda (*lazy loading*) los microfrontends remotos según la URL solicitada.
* Implementa **Error Boundaries** para aislar fallos de red o caídas de servidores remotos.
* Facilita el **Native Event Bus** sobre el objeto `window` del navegador para comunicación sin acoplamiento.

---

## 2. Mapa de Archivos Más Importantes

```text
appshell_frontend/
├── .env                              # Variables de entorno y switch USE_MOCKS
├── .env.example                      # Plantilla de variables para despliegue
├── scripts/
│   └── set-env.js                    # Sincronizador de .env hacia environment.ts
├── webpack.config.js                 # Configuración de Module Federation Host
├── src/
│   ├── theme-variables.css           # Tokens de diseño oficiales (CONTRATO_FRONTEND_UI_UX)
│   ├── environments/
│   │   └── environment.ts            # Configuración generada automáticamente
│   └── app/
│       ├── app.routes.ts             # Carga diferida con fallbacks resilientes
│       ├── app.component.ts          # Contenedor maestro del Shell
│       ├── models/user.model.ts      # Interfaces TypeScript de SSO y Eventos
│       ├── services/
│       │   ├── auth.service.ts       # Sesión SSO con Signals y cookies HttpOnly
│       │   └── event-bus.service.ts  # Native Event Bus (window.addEventListener)
│       └── components/
│           ├── navbar/               # Topbar institucional y semáforo de eventos
│           ├── login-modal/          # Modal SSO con validaciones rojas
│           ├── remote-fallback/      # Error Boundary visual ante caídas de remotos
│           ├── flotas-wrapper/       # Contenedor isla DOM para React 18 (Maikol)
│           ├── inventario-wrapper/   # Contenedor isla DOM para Vue 3 (Jael)
│           └── reportes-shell/       # Consola de reportes IA FastMCP (MS-05)
```

---

## 3. Desglose Detallado de Archivos y Fragmentos de Código

### 3.1. `webpack.config.js` — Orquestación de Module Federation
Este archivo configura a Webpack 5 para reconocer los remotos externos y compartir las dependencias angulares como *singletons* obligatorios para evitar duplicar el runtime en memoria:

```javascript
const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {
    // Apunta al archivo remoteEntry.js generado por mfe1_comandos_frontend
    mfe1_comandos_frontend: "http://localhost:4201/remoteEntry.js",
  },
  shared: {
    // Comparte Angular Core, Common, Router para no transferirlos doble
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
```
* **Punto Clave:** El App Shell no empaqueta el código de `mfe1`, `mfe2` ni `mfe3`; los enlaza en tiempo de ejecución.

---

### 3.2. `src/app/app.routes.ts` — Lazy Loading y Error Boundaries
En este archivo reside la regla de oro: **si un microfrontend se cae o no responde en su puerto, el App Shell no se congela ni lanza un error fatal de pantalla blanca**. Se atrapa la excepción con `.catch()` y se monta el componente de contingencia:

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'crisis', pathMatch: 'full' },
  {
    path: 'crisis',
    loadComponent: () =>
      loadRemoteModule({
        type: 'script',
        remoteName: 'mfe1_comandos_frontend',
        remoteEntry: environment.mfe1CrisisUrl,
        exposedModule: './Component'
      })
      .then(m => m.CrisisRoomComponent || m.AppComponent)
      .catch(err => {
        console.warn('[AppShell] Remote mfe1_comandos_frontend no disponible:', err);
        return CrisisFallbackComponent; // <-- Atrapa el fallo y renderiza fallback
      })
  },
  { path: 'flotas', component: FlotasWrapperComponent },
  { path: 'inventario', component: InventarioWrapperComponent },
  {
    path: 'reportes',
    loadComponent: () =>
      loadRemoteModule({
        type: 'script',
        remoteName: 'mfe1_comandos_frontend',
        remoteEntry: environment.mfe1CrisisUrl,
        exposedModule: './Reportes'
      })
      .then(m => m.ReportesComponent)
      .catch(err => {
        console.warn('[AppShell] Remote mfe1_comandos_frontend (Reportes) no disponible:', err);
        return ReportesShellComponent; // Fallback contingente
      })
  }
];
```

---

### 3.3. `src/app/services/auth.service.ts` — Sesión SSO con Signals
Gestiona el estado reactivo del usuario conectado (`currentUser`, `isAuthenticated`) usando **Angular Signals** en lugar de RxJS complejo o stores pesados. Propaga credenciales seguras con `withCredentials: true`:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiMs1Url}/auth`;
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => this.currentUser() !== null);

  public login(email: string, password: string): Observable<User> {
    if (environment.useMocks) {
      const mockUser: User = {
        id: 'USR-NAT-01',
        email,
        nombre: 'Nataly Martínez',
        rol: 'OPERADOR',
        estacion: 'Estación Central - Santa Cruz'
      };
      this.establecerUsuario(mockUser);
      return of(mockUser);
    }

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      map(res => {
        const user = res.user;
        this.establecerUsuario(user);
        return user;
      })
    );
  }
}
```

---

### 3.4. `src/app/services/event-bus.service.ts` — Bus de Eventos Nativo del DOM
Cumple con la prohibición absoluta de usar Redux o Pinia en el Shell. Utiliza el estándar web `CustomEvent` sobre `window`:

```typescript
@Injectable({ providedIn: 'root' })
export class EventBusService {
  public ultimoDespacho = signal<BomberoDispatchEventDetail | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('BOMBERO_DISPATCH_EVENT', (event: Event) => {
        const customEvent = event as CustomEvent<BomberoDispatchEventDetail>;
        if (customEvent.detail) {
          console.log('[Native Event Bus] Interceptado BOMBERO_DISPATCH_EVENT:', customEvent.detail);
          this.ultimoDespacho.set(customEvent.detail); // Notifica a la barra superior
        }
      });
    }
  }
}
```

---

### 3.5. `src/app/components/login-modal/login-modal.component.ts` — Validaciones Rojas y Contención
Aplica la regla de oro: **el modal nunca se cierra si el servidor responde con error**. Además, despliega los errores de validación de campos en color rojo `#DC2626`:

```typescript
public login(): void {
  const errores: { email?: string; password?: string } = {};

  if (!this.email().trim()) {
    errores.email = 'El correo institucional del bombero es obligatorio.';
  }
  if (!this.password()) {
    errores.password = 'La contraseña táctica no puede estar vacía.';
  }

  if (Object.keys(errores).length > 0) {
    this.erroresCampos.set(errores); // Activa .field-error-text (#DC2626)
    return;
  }

  this.authService.login(this.email(), this.password()).subscribe({
    next: () => this.cerrado.emit(),
    error: (err) => {
      // REGLA INVIOLABLE: No cerrar el modal, mostrar banner .modal-alert-danger
      this.errorMensaje.set(err.message || 'Error en autenticación SSO');
    }
  });
}
```

---

### 3.6. `scripts/set-env.js` y `.env` — Sincronización Automática
Evita tener rutas fijas (hardcodeadas). Lee el archivo `.env` y genera `src/environments/environment.ts` de forma transparente antes de compilar o servir:

```bash
# Para actualizar las variables sin tocar código TypeScript:
nano .env
npm run config:env
```
