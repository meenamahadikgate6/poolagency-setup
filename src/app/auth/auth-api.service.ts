import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { buildAuthHeaders } from './api-headers.util';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get('/api/profile', buildAuthHeaders());
  }

  updatePassword(data: any) {
    return this.http.put('/api/change-password', data, buildAuthHeaders());
  }

  deleteAccount() {
    return this.http.delete('/api/delete-account', buildAuthHeaders());
  }
}
