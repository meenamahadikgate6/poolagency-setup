import { environment } from './../../environments/environments';


import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token'); 
    const apiKey = environment.apiKey; 

    const headersConfig: { [key: string]: string } = {
      'X-Api-Key': apiKey
    };

    if (token) {
      // headersConfig['X-Auth-Token'] = token;
      headersConfig['X-Auth-Token'] = "r3aGhN3Ll2E32yxy524542F153yEu4xmem4tJ45kZVckA4RRr2N34u29325hn54U";
    }

    const modifiedReq = req.clone({ setHeaders: headersConfig });   
    return next.handle(modifiedReq );
  }
}

