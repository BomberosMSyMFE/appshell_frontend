import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, LoginModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public modalLoginAbierto = signal<boolean>(false);

  ngOnInit(): void {
    const modoOperacion = environment.useMocks
      ? '[MOCK LOCAL ACTIVO (useMocks: true)]'
      : '[PRODUCCION REAL (useMocks: false)]';

    const estilo = environment.useMocks
      ? 'color: #F59E0B; font-weight: bold; font-family: monospace; font-size: 11px;'
      : 'color: #10B981; font-weight: bold; font-family: monospace; font-size: 11px;';

    console.log(
      `%c=======================================================\n` +
      `SISTEMA BOMBEROS SANTA CRUZ - APP SHELL HOST (:4200)\n` +
      `Modo de Operación: ${modoOperacion}\n` +
      `API MS-01 Comandos: ${environment.apiMs1Url}\n` +
      `MFE-01 Crisis Remoto: ${environment.mfe1CrisisUrl}\n` +
      `MFE-02 Flotas Remoto: ${environment.mfe2FlotasUrl}\n` +
      `MFE-03 Inventario: ${environment.mfe3InventarioUrl}\n` +
      `=======================================================`,
      estilo
    );
  }
}

