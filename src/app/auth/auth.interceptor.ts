import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';
import { API_KEY } from './api.constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token'); 
    const apiKey = API_KEY; 

    const headersConfig: { [key: string]: string } = {
      'X-Api-Key': apiKey
    };

    if (token) {
      headersConfig['X-Auth-Token'] = token;
    }

    const modifiedReq = req.clone({ setHeaders: headersConfig });   
    return next.handle(modifiedReq );
  }
}

