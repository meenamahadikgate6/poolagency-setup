import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}

  // getProfile() {
  //   return this.http.get('/api/profile');
  // }

  // updatePassword(data: any) {
  //   return this.http.put('/api/change-password', data,);
  // }

  // deleteAccount() {
  //   return this.http.delete('/api/delete-account');
  // }
}
