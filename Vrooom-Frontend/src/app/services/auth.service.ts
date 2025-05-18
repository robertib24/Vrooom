import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _isAuthenticated = this.parseAuthFlag(localStorage.getItem('isAuth'));

  private readonly isAuthenticatedSubject$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(this._isAuthenticated);
  private readonly isAuthenticated$ =
    this.isAuthenticatedSubject$.asObservable();

  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$;
  }

  set isAuthenticated(flag: boolean) {
    localStorage.setItem('isAuth', JSON.stringify(flag));

    this._isAuthenticated = flag;
    this.isAuthenticatedSubject$.next(flag);
  }

  private mockUser() {
    localStorage.setItem(
      'user',
      JSON.stringify({
        firstName: 'User',
        lastName: 'Cool',
        email: 'user@cool.com',
      }),
    );
  }

  auth(credentialsObj: any) {
    this.mockUser();

    setTimeout(() => {
      // credentialsObj
      this.isAuthenticated = true;
      return true;
    }, 3000);
  }

  signup(userObj: any) {
    this.mockUser();

    setTimeout(() => {
      // credentialsObj
      this.isAuthenticated = true;
      return true;
    }, 3000);
  }

  signout() {
    localStorage.removeItem('isAuth');
    this.isAuthenticated = false;
  }

  private parseAuthFlag(flag: string | null) {
    return flag === 'true' ? true : false;
  }
}
