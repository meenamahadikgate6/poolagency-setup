import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class HttpService {
    constructor(private httpClient: HttpClient) {}

    postData(apiPath: string, data: any) {
        return this.httpClient.post(`${apiPath}`, data);
    }
    
    patchData(apiPath: string, data: any) {
        return this.httpClient.patch(`${apiPath}`, data);
    } 

    getData(apiPath: string, data?: any, option?: any) {
        return this.httpClient.get(`${apiPath}`, { params: data, ...option }).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    putData(apiPath: string, data: any) {
        return this.httpClient.put(`${apiPath}`, data);
    }


    deleteData(apiPath: string, data?: any) {
        return this.httpClient.delete(apiPath, data);
    }
}
