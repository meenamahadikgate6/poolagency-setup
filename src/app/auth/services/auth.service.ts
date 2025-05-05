import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor() {}

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  getSession(): any | null {
    debugger;
    const sessionCookie = this.getCookie('session');
    if (!sessionCookie) return null;
    try {
      return JSON.parse(decodeURIComponent(sessionCookie));
    } catch (err) {
      console.error('Error parsing session cookie:', err);
      return null;
    }
  }
  

  private getCookie(name: string): string | null {
    debugger;
    const cookies = document.cookie.split(';').map(c => c.trim());
    return cookies.find(c => c.startsWith(name + '='))?.split('=')[1] ?? null;
  }
}
