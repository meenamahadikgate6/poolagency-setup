import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { HttpService } from '../../shared/services/http.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor() {}


  getToken(): string | null {
    return this.getSession()?.token || null;
  }


  getSession() {
    const sessionCookie = this.getCookie('session');
    if (sessionCookie) {
      try {
        const decoded = decodeURIComponent(sessionCookie);
        const session = JSON.parse(decoded);
        return session;
      } catch (err) {
        console.error('Error parsing session cookie:', err);
        return null;
      }
    }
    return null;
  }
  
  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  return null;
  }
}
