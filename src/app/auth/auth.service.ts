import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { LOGIN_ENDPOINT } from './api.constants';
import { buildAuthHeaders } from './api-headers.util';
import { HttpService } from '../shared/services/http.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  // isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private httpService: HttpService) {}

  login(email: string, password: string, rememberMe: boolean = false) {
    const payload = { email, password, remember_me: rememberMe };
    return this.http.post<{ token: any }>(
      LOGIN_ENDPOINT,
      payload,
      buildAuthHeaders()
    ).pipe(
      tap((res:any) => {
        localStorage.setItem('token', res.data.token);
        // this.isAuthenticatedSubject.next(true);
      })
    );
  }

//   login(email: string, password: string, rememberMe: boolean = false) {
//     const payload = { email, password, remember_me: rememberMe };
//     return this.httpService.postData(LOGIN_ENDPOINT, payload);
// }

  logout() {
    localStorage.removeItem('token');
    // this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
