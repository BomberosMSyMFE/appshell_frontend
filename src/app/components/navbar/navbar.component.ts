import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventBusService } from '../../services/event-bus.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() public abrirLogin = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    public eventBus: EventBusService
  ) {}

  public onLoginClick(): void {
    this.abrirLogin.emit();
  }

  public onLogoutClick(): void {
    this.authService.logout();
  }
}
