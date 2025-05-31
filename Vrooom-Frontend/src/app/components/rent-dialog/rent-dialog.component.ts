import { Component, EventEmitter, Output, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DateUtils } from '../../utils/date.utils';

@Component({
  selector: 'app-rent-dialog',
  templateUrl: './rent-dialog.component.html',
  styleUrls: ['./rent-dialog.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatStepperModule,
    MatSelectModule,
    MatIconModule,
  ],
})
export class RentDialogComponent {
  @Output() onBookEvent: EventEmitter<any> = new EventEmitter<any>();

  datesForm = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required]),
  });

  paymentForm = new FormGroup({
    cardNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{16}$/)]),
    expiryDate: new FormControl('', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]),
    cvv: new FormControl('', [Validators.required, Validators.pattern(/^\d{3,4}$/)]),
    cardName: new FormControl('', [Validators.required]),
  });

  totalPrice = 0;
  totalDays = 0;

  constructor(
    private dialogRef: MatDialogRef<RentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vehicle: any }
  ) {
    this.datesForm.valueChanges.subscribe(() => {
      this.calculatePrice();
    });
  }

  calculatePrice() {
    const startDate = this.datesForm.get('start')?.value;
    const endDate = this.datesForm.get('end')?.value;
    
    if (startDate && endDate) {
      const timeDiff = endDate.getTime() - startDate.getTime();
      this.totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      this.totalPrice = this.totalDays * (this.data.vehicle?.pret || 0);
    }
  }

  completeBooking() {
  if (this.datesForm.invalid || this.paymentForm.invalid) {
    return;
  }
  
  // FIX: Convert dates to proper format for backend
  const startDate = this.datesForm.get('start')?.value;
  const endDate = this.datesForm.get('end')?.value;
  
  if (!startDate || !endDate) return;
  const fixedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);
  const fixedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 12, 0, 0);
  
  const bookingData = {
    start: fixedStartDate,
    end: fixedEndDate,
    payment: {
      cardNumber: this.paymentForm.get('cardNumber')?.value,
      expiryDate: this.paymentForm.get('expiryDate')?.value,
      cvv: this.paymentForm.get('cvv')?.value,
      cardName: this.paymentForm.get('cardName')?.value,
    },
    totalPrice: this.totalPrice,
    totalDays: this.totalDays
  };
  
  this.onBookEvent.emit(bookingData);
  this.dialogRef.close();
}

  cancel() {
    this.dialogRef.close();
  }
}