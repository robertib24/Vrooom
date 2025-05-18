import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (Route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated: Signal<any | undefined> = toSignal(
    authService.isAuthenticated,
  );

  if (isAuthenticated() === false) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
