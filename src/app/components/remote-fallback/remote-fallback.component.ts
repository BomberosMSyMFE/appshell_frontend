import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-remote-fallback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './remote-fallback.component.html',
  styleUrls: ['./remote-fallback.component.css']
})
export class RemoteFallbackComponent {
  @Input() public remoteName: string = 'Microfrontend Remoto';
  @Input() public port: number = 4201;
  @Input() public framework: string = 'Angular / React / Vue';
  @Input() public responsable: string = 'Equipo Bomberos';

  public reintentando = signal<boolean>(false);

  public reintentarCarga(): void {
    this.reintentando.set(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }
}
