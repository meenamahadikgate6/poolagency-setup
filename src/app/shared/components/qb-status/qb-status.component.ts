import { HttpClientModule } from '@angular/common/http';
// qb-status.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CrmStatusService } from '../../services/crm-status.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-qb-status',
  templateUrl: './qb-status.component.html',
  styleUrls: ['./qb-status.component.css'],
  imports: [
    CommonModule,
  ]
})
export class QbStatusComponent implements OnInit {
  crmStatus: any;
  @Input('success-sync') successSync: any;
  @Input('  qb-connected-now') qbConnectedNow: any;

  constructor(private crmStatusService: CrmStatusService, private authService: AuthService) {
  }

  ngOnInit() {
    const session = this.authService.getSession?.(); 
  
    if (session?.companyId) {
      this.crmStatusService.updateCrmStatus(session.companyId).subscribe((res:any) => {
        // console.log("updateCrmStatus", res)
        this.crmStatus = res
      })
    }
  
;
  }
}
