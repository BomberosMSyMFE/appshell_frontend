# `appshell_frontend` — Contenedor Maestro y Host Federado

**Plataforma Distribuida para el Cuerpo de Bomberos — INF512 (Ingeniería de Software II)**  
**Semestre:** 2/2026 — UAGRM  
**Docente:** M.Sc. Ing. Rolando Antonio Martinez Canedo  
**Responsable:** Nataly Martínez (Líder / Fullstack)  
**Tecnología:** Angular 18 (Standalone Components, Signals, RxJS) + Webpack 5 Module Federation  
**Puerto Asignado:** `4200` (`http://localhost:4200`)

---

## 1. Misión y Responsabilidades del Host

El **App Shell** actúa como el contenedor anfitrión central de la plataforma web. No gestiona directamente reglas de negocio específicas de subdominios, sino que provee la infraestructura visual y de runtime compartida:

1. **Barra de Navegación Global Unificada (`NavbarComponent`):**  
   Encabezado táctico de alto contraste (`#1A1A1A`) con escudo institucional de bomberos, navegación declarativa y píldora de sesión SSO.
2. **Autenticación Centralizada (SSO):**  
   Gestión de sesión institucional con propagación de cookies `HttpOnly` (`withCredentials: true`) contra el backend `ms1_comandos_backend` (`http://localhost:3000/api/v1/auth`). Modal táctico con validaciones en letras rojas (`#DC2626`) y contención de errores.
3. **Orquestación de Microfrontends en Runtime:**  
   Carga dinámica bajo demanda (*lazy loading*) mediante Webpack 5 Module Federation (`loadRemoteModule`):
   - `/crisis` -> Carga `mfe1_comandos_frontend` (Angular 18 / Nataly Martínez en puerto 4201).
   - `/flotas` -> Carga `mfe2_flotas_frontend` (React 18 / Maikol Molina en puerto 4202).
   - `/inventario` -> Carga `mfe3_inventario_frontend` (Vue 3 / Jael Sandoval en puerto 4203).
   - `/reportes` -> Consola Multimodal de Reportes Tácticos con IA FastMCP (MS-05).
4. **Resiliencia y Error Boundaries (`RemoteFallbackComponent`):**  
   Si cualquiera de los microfrontends remotos sufre una caída de red o está apagado, el App Shell atrapa el fallo en la frontera del módulo y renderiza un componente de contingencia sin congelar ni tumbar los demás módulos.
5. **Bus de Eventos Nativo Desacoplado:**  
   Comunicación inter-microfrontends mediante eventos nativos del navegador (`window.dispatchEvent` y `window.addEventListener('BOMBERO_DISPATCH_EVENT', ...)`). **Estrictamente prohibido usar stores globales como Redux o Pinia en el Shell.**

---

## 2. Diagrama de Arquitectura de Ensamble (ASCII)

```
========================= HOST APP SHELL (PUERTO 4200) =========================
+-------------------------------------------------------------------------------+
| TOPBAR INSTITUCIONAL: Escudo Bomberos | Enlaces MFE | Event Bus | Usuario SSO  |
+-------------------------------------------------------------------------------+
       |                                |                               |
       | /crisis                        | /flotas                       | /inventario
       v (Puerto 4201)                  v (Puerto 4202)                 v (Puerto 4203)
+-----------------------+      +-----------------------+      +-----------------------+
| MFE-01: COMANDOS      |      | MFE-02: FLOTAS Y GIS  |      | MFE-03: INVENTARIO    |
| Framework: Angular 18 |      | Framework: React 18   |      | Framework: Vue 3      |
| Sala de Crisis, WSS,  |      | Visor Leaflet / GPS,  |      | Apollo GraphQL, EPP,  |
| SAGA H-i-t-L          |      | Telemetría Camiones   |      | Insumos Químicos      |
+-----------------------+      +-----------------------+      +-----------------------+
       |                                |                               |
       +--------------------------------+-------------------------------+
                                        |
                 Bus Nativo DOM: BOMBERO_DISPATCH_EVENT (window)
```

---

## 3. Contrato UI/UX y Sistema de Diseño

El Host implementa estrictamente las directrices de `shared_contracts_specs/frontend/CONTRATO_FRONTEND_UI_UX.md`:
* **Paleta Oficial:** `#CE2029` (Rojo Fuego Bomberos), `#7A1E24` (Granate Mando), `#FEB000` (Ámbar Alerta), `#1A1A1A` (Negro Carbón), `#F5F2EA` (Blanco Humo), `#FFFFFF` (Blanco Puro), `#F8FAFC` (Slate Fondo).
* **Prohibición de Emojis:** Se utiliza exclusivamente iconografía vectorial **Bootstrap Icons** (`bi bi-*`).
* **Botones Profesionales:** Geometría rectangular con radio sutil (`border-radius: 4px` a `6px`).
* **Tipografía:** `'Inter'` para lectura y `'JetBrains Mono'` para códigos de telemetría y placas.

---

## 4. Puesta en Marcha en Desarrollo

```bash
# 1. Acceder al directorio
cd appshell_frontend

# 2. Compilar bundles de producción
npm run build

# 3. Iniciar servidor de desarrollo en puerto 4200
npm start
```

Abrir en el navegador: `http://localhost:4200`
