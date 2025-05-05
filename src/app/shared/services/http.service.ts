import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(public httpClient: HttpClient) {}

  post(apiPath: string, data: any) {
    return this.httpClient.post(apiPath, data).pipe(
      map((response: any) => response?.data || response),
      catchError(this.handleError)
    );
  }

  patch(apiPath: string, data: any) {
    return this.httpClient.patch(apiPath, data).pipe(
      map((response: any) => response?.data || response),
      catchError(this.handleError)
    );
  }

  get(apiPath: string, data?: any, option?: any) {
    return this.httpClient.get(apiPath, { params: data, ...option }).pipe(
      map((response: any) => response?.data || response),
      catchError(this.handleError)
    );
  }

  put(apiPath: string, data: any) {
    return this.httpClient.put(apiPath, data).pipe(
      map((response: any) => response?.data || response),
      catchError(this.handleError)
    );
  }

  delete(apiPath: string, options?: any) {
    return this.httpClient.delete(apiPath, options).pipe(
      map((response: any) => response?.data || response),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side/network error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Backend error with status
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request (400)';
          break;
        case 401:
          errorMessage = 'Unauthorized (401)';
          break;
        case 403:
          errorMessage = 'Forbidden (403)';
          break;
        case 404:
          errorMessage = 'Not Found (404)';
          break;
        case 500:
          errorMessage = 'Server Error (500)';
          break;
        default:
          errorMessage = `Unexpected Error (${error.status})`;
      }
    }

    // Optionally log to external service
    console.error('HTTP Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
