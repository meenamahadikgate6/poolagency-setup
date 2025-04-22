import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-qb-status',
  templateUrl: './qb-status.component.html',
  styleUrls: ['./qb-status.component.css'],
  imports: [CommonModule]
})
export class QbStatusComponent implements OnInit, OnChanges {
  @Input() crmStatus?: any;
  @Input() qbConnectedNow?: boolean = false;
  @Input() successSync?: string = '';
  constructor() {
    console.log('[QbStatus] constructor called');
  }
  ngOnInit(): void {
    console.log(' Initialized', this.crmStatus);
    debugger
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log(' Initialized', this.crmStatus, this.qbConnectedNow, this.successSync);
    // if (changes['crmStatus']) {
    //   console.log('[QbStatus] crmStatus:', changes['crmStatus'].currentValue);
    // }
    // if (changes['qbConnectedNow']) {
    //   console.log('[QbStatus] qbConnectedNow:', changes['qbConnectedNow'].currentValue);
    // }
    // if (changes['successSync']) {
    //   console.log('[QbStatus] successSync:', changes['successSync'].currentValue);
    // }
  }

  quickBookIntegration() {
    const event = new CustomEvent('quickBookIntegrationClicked', {
      bubbles: true,
      detail: {}
    });
    window.dispatchEvent(event);
  }
}
