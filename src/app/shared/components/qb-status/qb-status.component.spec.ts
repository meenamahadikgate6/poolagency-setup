import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QbStatusComponent } from './qb-status.component';

describe('QbStatusComponent', () => {
  let component: QbStatusComponent;
  let fixture: ComponentFixture<QbStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QbStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QbStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
