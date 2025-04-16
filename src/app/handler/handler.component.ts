import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-handler',
  templateUrl: './handler.component.html',
  styleUrl: './handler.component.scss'
})
export class HandlerComponent implements OnInit {
  constructor(private router: Router) { }
  
  ngOnInit(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
