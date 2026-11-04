import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent {
  @Output() public cerrado = new EventEmitter<void>();

  public email = signal<string>('nataly.comandos@bomberos.gob.bo');
  public password = signal<string>('bomberos2026');
  public enviando = signal<boolean>(false);
  public errorMensaje = signal<string | null>(null);
  public erroresCampos = signal<{ email?: string; password?: string }>({});

  constructor(private authService: AuthService) {}

  public login(): void {
    const em = this.email().trim();
    const pw = this.password();

    const errores: { email?: string; password?: string } = {};

    if (!em) {
      errores.email = 'El correo institucional del bombero es obligatorio.';
    } else if (!em.includes('@')) {
      errores.email = 'Ingrese un formato de correo electrónico válido.';
    }

    if (!pw) {
      errores.password = 'La contraseña táctica no puede estar vacía.';
    }

    if (Object.keys(errores).length > 0) {
      this.erroresCampos.set(errores);
      return;
    }

    this.erroresCampos.set({});
    this.enviando.set(true);
    this.errorMensaje.set(null);

    this.authService.login(em, pw).subscribe({
      next: () => {
        this.enviando.set(false);
        this.cerrado.emit();
      },
      error: (err) => {
        this.enviando.set(false);
        // REGLA INVIOLABLE: El modal NUNCA se cierra ante errores
        this.errorMensaje.set(err.message || 'Error en autenticación SSO. Verifique sus credenciales.');
      }
    });
  }

  public cerrar(): void {
    if (this.enviando()) return;
    this.cerrado.emit();
  }

  public demoLoginNataly(): void {
    this.email.set('nataly.comandos@bomberos.gob.bo');
    this.password.set('bomberos2026');
    this.login();
  }
}
