import { HttpClientModule } from '@angular/common/http';
// qb-status.component.ts
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CrmStatusService } from '../../services/crm-status.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { SocketService } from '../../services/socket.service';

declare global {
  interface Window {
    socketServiceInstance: any;
  }
}
@Component({
  standalone: true,
  selector: 'app-qb-status',
  templateUrl: './qb-status.component.html',
  styleUrls: ['./qb-status.component.css'],
  imports: [CommonModule],
})
export class QbStatusComponent implements OnInit, OnChanges {
  crmStatus: any;
  complexObject: any;

  


  @Output() passData? = new EventEmitter<any>();
  private _qbConnectedNow: any;
  @Input('success-sync') successSync: any;

  @Input('qb-connected-now') set qbConnectedNow(value: any) {
    this._qbConnectedNow = value === 'true'; // Convert string back to boolean
    console.log('qbConnectedNow:', this._qbConnectedNow);
  }

  @Input()
  set crmstatus(value: any) {
    
    this.crmStatus = value;
    console.log("crmStatus:", this.crmStatus);
  }

  get qbConnectedNow() {
    return this._qbConnectedNow;
  }

  constructor(
    private crmStatusService: CrmStatusService,
    private authService: AuthService
  ) {
    const complexObject: any = {
      user: {
          id: 101,
          name: "John Doe",
          contact: {
              email: "john.doe@example.com",
              phone: "+1234567890"
          }
      },
      company: {
          name: "Tech Innovators",
          location: {
              city: "San Francisco",
              country: "USA"
          },
          departments: [
              {
                  name: "Engineering",
                  employees: [
                      { id: 1, name: "Alice", role: "Software Engineer" },
                      { id: 2, name: "Bob", role: "DevOps Engineer" }
                  ]
              },
              {
                  name: "Marketing",
                  employees: [
                      { id: 3, name: "Charlie", role: "Social Media Manager" },
                      { id: 4, name: "David", role: "SEO Specialist" }
                  ]
              }
          ]
      },
      metadata: {
          createdAt: new Date(),
          isActive: true
      }
  };

  }

  ngOnInit() {    
    const session = this.authService.getSession ? this.authService.getSession() : null;
    if (session?.companyId) {
      this.crmStatusService.updateCrmStatus(session.companyId).subscribe({
        next: (res: any) => {
          console.log("updateCrmStatus response:", res);
          this.crmStatus = res;
          if (this.passData) {
            console.log("Event Emitted! 1", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
            
            
            this.passData.emit({...this.complexObject});
         
            console.log("Event Emitted! 2", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
         
          } else {
              console.warn("this.passData is undefined");
          }
      },
      error: (err: any) => {
          console.error("API error:", err);
      }
      })
    }

    
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log('changes', changes);
  }
}
