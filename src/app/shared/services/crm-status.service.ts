import { environment } from './../../../environments/environments';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpService } from './http.service';
import { QBSTATUS_LOGIN_ENDPOINT } from '../../auth/api.constants';

@Injectable({ providedIn: 'root' })
export class CrmStatusService {
  private crmStatusSubject = new BehaviorSubject<any>({});
  crmStatus$ = this.crmStatusSubject.asObservable();
  private env = environment;

  private qbConnectedNow = false;

  constructor(private http: HttpService) {}

  setCrmStatus(data: any) {
    this.crmStatusSubject.next(data);
  }

  getCrmStatusSnapshot() {
    return this.crmStatusSubject.getValue();
  }

  isQbConnected() {
    return this.qbConnectedNow;
  }

  updateCrmStatus(companyId: string) {
    // const url = `${this.env.apiBaseUrl}/company/crm_status`;
    return this.http.get(QBSTATUS_LOGIN_ENDPOINT, {companyId: companyId });
  }

}
