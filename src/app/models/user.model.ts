export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'COMANDANTE' | 'OFICIAL_GUARDIA' | 'MAQUINISTA' | 'RADIO_OPERADOR';
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
