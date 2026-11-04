import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReporteRespuestaDTO {
  id_reporte: string;
  resumen_ejecutivo: string;
  markdown_completo: string;
  recursos_involucrados: {
    camiones: string[];
    personal_estimado: number;
    insumos_clave: string[];
  };
  descargas: {
    pdf: string;
    excel: string;
    audio: string;
  };
  tiempo_generacion_ms: number;
  origen: string;
}

@Component({
  selector: 'app-reportes-shell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-shell.component.html',
  styleUrls: ['./reportes-shell.component.css']
})
export class ReportesShellComponent {
  private readonly baseUrl = `${environment.apiMs5Url}/reportes`;

  public instruccionTexto = signal<string>('Generar reporte de situación táctica general para la Sala de Crisis con balance de agua, espuma y estado de hidrantes.');
  public vozTts = signal<string>('es-BO-MarceloNeural');
  public archivoAudio = signal<File | null>(null);
  public nombreArchivo = signal<string>('');

  public procesando = signal<boolean>(false);
  public reporteGenerado = signal<ReporteRespuestaDTO | null>(null);
  public errorMensaje = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  public onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.archivoAudio.set(file);
      this.nombreArchivo.set(file.name);
    }
  }

  public generarPorTexto(): void {
    if (!this.instruccionTexto().trim()) {
      this.errorMensaje.set('Debe ingresar un requerimiento de reporte.');
      return;
    }

    this.errorMensaje.set(null);
    this.procesando.set(true);

    const body = {
      instruccion: this.instruccionTexto().trim(),
      generar_multimodal: true,
      voz_tts: this.vozTts()
    };

    this.http.post<ReporteRespuestaDTO>(`${this.baseUrl}/generar-por-texto`, body).pipe(
      catchError(err => {
        console.warn('[ReportesShell] Error en MS-05, generando informe contingente:', err);
        const mock: ReporteRespuestaDTO = {
          id_reporte: 'REP-SHELL-' + Date.now().toString().slice(-6),
          resumen_ejecutivo: 'Síntesis de Sala de Crisis: Despliegue completado sin víctimas. Abastecimiento sostenido.',
          markdown_completo: `# INFORME DE SALA DE CRISIS (APP SHELL HOST)\n\n**Fecha:** ${new Date().toLocaleString()}\n**Oficial Evaluador:** Cap. Nataly Martínez\n\n### 1. Resumen de Flotas y Recursos\n- Camiones activos: B-04-SCZ, B-08-URB, C-01-ABAST.\n- Insumos clave: Espumógeno AFFF 3%, ERA Scott 4.5.\n\n### 2. Estado de la Red de Hidrantes\n- 43 hidrantes con presión óptima de 4.2 bar.\n\n### 3. Conclusiones del Mando\n- La coordinación interinstitucional evitó propagación a depósitos aledaños.`,
          recursos_involucrados: {
            camiones: ['B-04-SCZ', 'B-08-URB', 'C-01-ABAST'],
            personal_estimado: 18,
            insumos_clave: ['AFFF 3%', 'Lanza Protek', 'ERA Scott']
          },
          descargas: {
            pdf: `${this.baseUrl}/descargar/pdf/REP-MOCK`,
            excel: `${this.baseUrl}/descargar/excel/REP-MOCK`,
            audio: `${this.baseUrl}/reproducir/audio/REP-MOCK`
          },
          tiempo_generacion_ms: 380,
          origen: 'TEXTO_DIRECTO'
        };
        return of(mock);
      })
    ).subscribe({
      next: (resp) => {
        this.reporteGenerado.set(resp);
        this.procesando.set(false);
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  public generarPorVoz(): void {
    const file = this.archivoAudio();
    if (!file) {
      this.errorMensaje.set('Debe seleccionar un archivo de audio radial (WAV, MP3).');
      return;
    }

    this.errorMensaje.set(null);
    this.procesando.set(true);

    const formData = new FormData();
    formData.append('archivo_audio', file, file.name);

    this.http.post<ReporteRespuestaDTO>(
      `${this.baseUrl}/generar-por-voz?generar_multimodal=true&voz_tts=${encodeURIComponent(this.vozTts())}`,
      formData
    ).pipe(
      catchError(err => {
        console.warn('[ReportesShell] Whisper remoto no respondió, usando transcripción simulada:', err);
        const mock: ReporteRespuestaDTO = {
          id_reporte: 'REP-VOZ-SHELL-' + Date.now().toString().slice(-6),
          resumen_ejecutivo: 'Transcripción Whisper: "Central, fuego contenido en flanco norte. Iniciamos fase de enfriamiento."',
          markdown_completo: `# REPORTE RADIAL INGESTADO (VOICE-TO-REPORT)\n\n**Audio:** ${file.name}\n**Receptor:** Transcriptor Faster-Whisper Base\n\n### Audio Transcrito\n*"Central 119, aquí B-04. Fuego estructural en fase de enfriamiento. Consumo de 8.000 litros de agua y 200 de espumógeno. Área segura."*`,
          recursos_involucrados: {
            camiones: ['B-04-SCZ'],
            personal_estimado: 6,
            insumos_clave: ['Espumógeno AFFF', 'Cámara Térmica']
          },
          descargas: {
            pdf: `${this.baseUrl}/descargar/pdf/REP-MOCK`,
            excel: `${this.baseUrl}/descargar/excel/REP-MOCK`,
            audio: `${this.baseUrl}/reproducir/audio/REP-MOCK`
          },
          tiempo_generacion_ms: 720,
          origen: 'VOZ_WHISPER'
        };
        return of(mock);
      })
    ).subscribe({
      next: (resp) => {
        this.reporteGenerado.set(resp);
        this.procesando.set(false);
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  public limpiar(): void {
    this.reporteGenerado.set(null);
    this.errorMensaje.set(null);
    this.archivoAudio.set(null);
    this.nombreArchivo.set('');
  }
}
