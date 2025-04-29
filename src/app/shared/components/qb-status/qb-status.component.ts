import { HttpClientModule } from '@angular/common/http';
// qb-status.component.ts
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CrmStatusService } from '../../services/crm-status.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-qb-status',
  templateUrl: './qb-status.component.html',
  styleUrls: ['./qb-status.component.css'],
  imports: [CommonModule],
})
export class QbStatusComponent implements OnInit, OnChanges {
  crmStatus: any;
  private _qbConnectedNow: any;
  @Input('success-sync') successSync: any;

  @Input('qb-connected-now') set qbConnectedNow(value: any) {
    this._qbConnectedNow = value === 'true'; // Convert string back to boolean
    console.log('successSync received:', this._qbConnectedNow);
  }

  @Input()
  set crmstatus(value: any) {
    debugger;
    this.crmStatus = value;
    console.log("Received crmStatus:", this.crmStatus);
  }

  get qbConnectedNow() {
    return this._qbConnectedNow;
  }

  constructor(
    private crmStatusService: CrmStatusService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // const session = this.authService.getSession ? this.authService.getSession() : null;
    // if (session?.companyId) {
    //   this.crmStatusService.updateCrmStatus(session.companyId).subscribe((res:any) => {
    //     // console.log("updateCrmStatus", res)
    //     this.crmStatus = res
    //   })
    // }
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log('changes', changes);
  }
}
