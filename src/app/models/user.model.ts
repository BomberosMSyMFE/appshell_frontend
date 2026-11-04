export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'OPERADOR' | 'BOMBERO' | 'ADMINISTRADOR';
  estacion: string;
  placa?: string;
  token?: string;
}

export interface LoginResponse {
  user: User;
  mensaje?: string;
}

export interface BomberoDispatchEventDetail {
  evento: 'BOMBERO_DISPATCH_EVENT';
  transaccionId: string;
  incidenteId: string;
  camionId: string;
  materiales: string[];
  timestamp: string;
}
