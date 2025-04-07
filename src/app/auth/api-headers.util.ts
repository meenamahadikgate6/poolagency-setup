import { HttpHeaders } from '@angular/common/http';
import { API_KEY } from './api.constants';

export function buildAuthHeaders(): { headers: HttpHeaders } {
  const headers: Record<string, string> = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  };

  const sessionRaw = localStorage.getItem('session');
  try {
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    if (session?.token) {
      headers['X-AUTH-TOKEN'] = session.token;
    }
  } catch (e) {
    console.warn('Invalid session JSON in localStorage', e);
  }

  return {
    headers: new HttpHeaders(headers),
  };
}
