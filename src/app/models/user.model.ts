export interface UsuarioBackend {
  id: string;
  nombreCompleto?: string;
  nombre?: string;
  email: string;
  rol: string;
  estacionBase?: string;
  estacion?: string;
  telefonoMovil?: string;
  placa?: string;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  nombreCompleto?: string;
  rol: 'OPERADOR' | 'BOMBERO' | 'ADMINISTRADOR' | string;
  estacion: string;
  estacionBase?: string;
  telefonoMovil?: string;
  placa?: string;
  token?: string;
}

export interface LoginResponse {
  mensaje?: string;
  usuario?: UsuarioBackend;
  user?: UsuarioBackend;
  token?: string;
}

export interface BomberoDispatchEventDetail {
  evento: 'BOMBERO_DISPATCH_EVENT';
  transaccionId: string;
  incidenteId: string;
  camionId: string;
  materiales: string[];
  timestamp: string;
  direccion?: string;
  ubicacion?: string;
  cuadrante?: string;
  latitud?: number;
  longitud?: number;
}
