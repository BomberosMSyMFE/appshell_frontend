# Guía de Pruebas Funcionales y Resiliencia — `appshell_frontend`

**Plataforma Distribuida para el Cuerpo de Bomberos — INF512 (Ingeniería de Software II)**  
**Semestre:** 2/2026 — UAGRM  
**Docente:** M.Sc. Ing. Rolando Antonio Martinez Canedo  
**Responsable:** Nataly Martínez (Líder / Fullstack)  
**Host URL:** `http://localhost:4200`

---

## 1. Puesta en Marcha del Entorno

1. Abrir una terminal en `appshell_frontend`:
   ```bash
   cd /home/nataly/Projects/sw2/appshell_frontend
   npm start
   ```
2. Observar la consola: verás que `scripts/set-env.js` sincroniza automáticamente `.env` con `environment.ts` y levanta el servidor en `http://localhost:4200`.
3. Abrir en el navegador Google Chrome o Firefox: `http://localhost:4200`.

---

## 2. Batería de Pruebas Paso a Paso

### PRUEBA 1: Navegación Táctica Global y Carga Inicial
* **Objetivo:** Verificar que el Navbar maestro se visualiza correctamente y redirige a la Sala de Crisis por defecto.
* **Pasos:**
  1. Ingresar a `http://localhost:4200/`.
  2. Verificar que la URL cambia automáticamente a `http://localhost:4200/crisis`.
  3. Comprobar visualmente el encabezado:
     - Escudo de bomberos `<i class="bi bi-shield-shaded"></i>` con título **CUERPO DE BOMBEROS**.
     - Enlaces centrales: `Sala de Crisis`, `Flota y GIS`, `Insumos y Bodegas`, `Reportes IA Multimodal`.
     - Cero emojis visibles en toda la pantalla (cumplimiento del contrato UI/UX).

---

### PRUEBA 2: Intentar Tumbar el Shell Apagando los Remotos (Resiliencia y Error Boundaries)
* **Objetivo:** Demostrar ante el docente que la caída de un microfrontend no rompe la aplicación principal.
* **Pasos:**
  1. Asegurarse de que `mfe2_flotas_frontend` (puerto 4202) y `mfe3_inventario_frontend` (puerto 4203) no están encendidos en la máquina.
  2. En el Navbar, hacer clic en el enlace **`Flota y GIS`** (`/flotas`).
  3. **Resultado Esperado:** 
     - La pantalla NO se congela en blanco ni arroja una excepción fatal en la consola.
     - Aparece la tarjeta de contingencia táctica:
       - Badge amarillo: `<i class="bi bi-hdd-network"></i> FUERA DE LÍNEA`.
       - Título: **MFE2 - Visor Cartográfico y Telemetría de Flotas**.
       - Puerto: `4202`, Framework: `React 18 (Leaflet / Mapbox)`, Responsable: `Maikol Molina (INF512)`.
       - Mensaje explicativo de aislamiento de fallos con Webpack Module Federation.
     - Botón `[ Reintentar Conexión ]`: presionar para comprobar que recarga limpiamente.
  4. En el Navbar, hacer clic en **`Insumos y Bodegas`** (`/inventario`).
  5. **Resultado Esperado:**
     - Se renderiza de forma aislada la tarjeta de contingencia de Jael Sandoval (Vue 3 / GraphQL en puerto 4203).
     - El Navbar superior sigue 100% interactivo.

---

### PRUEBA 3: Prueba de Autenticación Centralizada (SSO) y Validaciones Rojas
* **Objetivo:** Probar el modal de login, las validaciones inline `#DC2626` y la permanencia del modal ante errores.
* **Pasos:**
  1. En el extremo superior derecho del Navbar, hacer clic en el botón de salida `<i class="bi bi-box-arrow-right"></i>` para cerrar la sesión actual.
  2. Verificar que la píldora de usuario cambia a un botón rojo: `[bi-box-arrow-in-right] Ingresar SSO`.
  3. Hacer clic en `[ Ingresar SSO ]`. Se desplegará el modal táctico.
  4. **Intentar Tumbar por Campos Vacíos:**
     - Borrar el correo y la contraseña.
     - Presionar el botón `[ Iniciar Sesión Táctica ]`.
     - **Resultado Esperado:**
       - Justo debajo del correo aparece en letras rojas `#DC2626`:  
         `<i class="bi bi-exclamation-circle-fill"></i> El correo institucional del bombero es obligatorio.`
       - Justo debajo de la contraseña aparece:  
         `<i class="bi bi-exclamation-circle-fill"></i> La contraseña táctica no puede estar vacía.`
       - Los bordes de los inputs se tornan rojos y con fondo suave `#FEF2F2`.
  5. **Prueba de Acceso Rápido de Defensa:**
     - En el modal, hacer clic en el botón de acceso rápido:  
       `[bi-person-badge-fill] Nataly Martínez (Operador Central 119)`.
     - Los campos se autocompletan con `nataly.comandos@bomberos.gob.bo` / `bomberos2026`.
     - El modal se autentica exitosamente y se cierra.
     - La cabecera superior ahora muestra: `Nataly Martínez` con el badge `OPERADOR` (rol verificado en `ms1_comandos_backend`).

---

### PRUEBA 4: Intercepción de Eventos en el Bus Nativo (`BOMBERO_DISPATCH_EVENT`)
* **Objetivo:** Comprobar que el App Shell escucha eventos desacoplados emitidos por cualquier microfrontend en el objeto `window`.
* **Pasos:**
  1. Abrir la consola de desarrollador del navegador (F12 -> pestaña *Console*).
  2. Pegar y ejecutar el siguiente comando simulando un despacho de camión:
     ```javascript
     window.dispatchEvent(new CustomEvent('BOMBERO_DISPATCH_EVENT', {
       detail: {
         evento: 'BOMBERO_DISPATCH_EVENT',
         transaccionId: 'TX-SAGA-999888',
         incidenteId: 'INC-101',
         camionId: 'B-04-SCZ',
         materiales: ['Lanza Protek', '250 L Espumógeno'],
         timestamp: new Date().toISOString()
       }
     }));
     ```
  3. **Resultado Esperado:**
     - En la consola se imprime: `[AppShell Native Event Bus] Interceptado BOMBERO_DISPATCH_EVENT`.
     - En la barra de navegación superior (Navbar), aparece de inmediato una píldora verde pulsante:
       `<i class="bi bi-send-check-fill text-success"></i> B-04-SCZ DESPACHADO`.

---

### PRUEBA 5: Consola de Reportes IA Directa desde el Shell (`/reportes`)
* **Objetivo:** Probar la integración directa con el microservicio de IA (MS-05).
* **Pasos:**
  1. En el Navbar, hacer clic en **`Reportes IA Multimodal`** (`/reportes`).
  2. En el panel izquierdo "Parámetros de Síntesis", escribir:
     `Generar balance hídrico y requerimiento de espumógeno para nave textil Parque Industrial.`
  3. Seleccionar voz neural: `es-BO-MarceloNeural (Oficial de Guardia)`.
  4. Presionar `[ Generar por Texto ]`.
  5. **Resultado Esperado:**
     - Aparece el estado de carga: `Sintetizando...`.
     - En el panel derecho se despliega:
       - Resumen ejecutivo en tarjeta ámbar.
       - Reproductor de audio neural con controles nativos (`<audio controls>`).
       - Botón rojo: `[ Descargar PDF WeasyPrint ]`.
       - Botón verde: `[ Descargar Excel OpenPyXL ]`.
       - Previsualización en tipografía monoespaciada con formato Markdown formal.

---

### PRUEBA 6: Conmutación de Modo de Trabajo (`USE_MOCKS=false`)
* **Objetivo:** Verificar la flexibilidad del archivo `.env` para apuntar a servicios desplegados en la nube o puertos personalizados.
* **Pasos:**
  1. Abrir el archivo `appshell_frontend/.env`:
     ```bash
     USE_MOCKS=false
     API_MS1_URL=http://localhost:3000/api/v1
     ```
  2. Reiniciar el dev server (`npm start`) o ejecutar `npm run config:env`.
  3. El App Shell ahora enviará las peticiones HTTP directamente contra el backend real de NestJS en el puerto 3000.
