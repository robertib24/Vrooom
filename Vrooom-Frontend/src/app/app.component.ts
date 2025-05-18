import { Component, inject, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatIconModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Vrooom';

  private authService = inject(AuthService);
  private router = inject(Router);

  public readonly isAuthenticated: Signal<any | undefined> = toSignal(
    this.authService.isAuthenticated,
    { initialValue: false },
  );

  signout() {
    this.authService.signout();
    this.router.navigate(['/login']);
  }
}
