import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupportService } from '../../services/support.service';
import { TokenService } from '../../services/token.service';

export interface ContactDialogData {
  vehicle: any;
  owner: any;
}

@Component({
  selector: 'app-contact-owner-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>message</mat-icon>
      Contact {{ data.owner.prenume }} {{ data.owner.nume }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="owner-info">
        <img 
          [src]="data.owner.linkPozaProfil || 'assets/default-avatar.png'" 
          [alt]="data.owner.prenume + ' ' + data.owner.nume"
          class="owner-avatar">
        <div class="owner-details">
          <h3>{{ data.owner.prenume }} {{ data.owner.nume }}</h3>
          <p class="vehicle-info">Owner of {{ data.vehicle.firma }} {{ data.vehicle.model }}</p>
          <div class="owner-stats">
            <span class="stat">
              <mat-icon>star</mat-icon>
              {{ getOwnerRating() }} rating
            </span>
            <span class="stat">
              <mat-icon>directions_car</mat-icon>
              {{ data.owner.nrPostari }} vehicle{{ data.owner.nrPostari !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
      </div>

      <form [formGroup]="contactForm" class="contact-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Subject</mat-label>
          <mat-select formControlName="subject">
            <mat-option value="booking_inquiry">Booking Inquiry</mat-option>
            <mat-option value="vehicle_question">Vehicle Question</mat-option>
            <mat-option value="pricing">Pricing Information</mat-option>
            <mat-option value="availability">Availability Check</mat-option>
            <mat-option value="pickup_location">Pickup Location</mat-option>
            <mat-option value="other">Other</mat-option>
          </mat-select>
          <mat-icon matSuffix>subject</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Your Message</mat-label>
          <textarea 
            matInput 
            formControlName="message"
            rows="6"
            placeholder="Type your message here..."
            maxlength="1000">
          </textarea>
          <mat-hint align="end">{{ contactForm.get('message')?.value?.length || 0 }}/1000</mat-hint>
          <mat-icon matSuffix>edit</mat-icon>
        </mat-form-field>

        <div class="message-templates" *ngIf="!showCustomMessage">
          <p class="templates-title">Or use a quick template:</p>
          <div class="template-buttons">
            <button type="button" mat-button (click)="useTemplate('booking')" class="template-btn">
              <mat-icon>event</mat-icon>
              "I'm interested in booking this vehicle"
            </button>
            <button type="button" mat-button (click)="useTemplate('availability')" class="template-btn">
              <mat-icon>schedule</mat-icon>
              "Is this vehicle available on specific dates?"
            </button>
            <button type="button" mat-button (click)="useTemplate('questions')" class="template-btn">
              <mat-icon>help</mat-icon>
              "I have some questions about the vehicle"
            </button>
          </div>
        </div>
      </form>

      <div class="privacy-notice">
        <mat-icon>info</mat-icon>
        <span>Your message will be sent as a support ticket. The owner will receive an email notification and can respond through the platform.</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="cancel()" [disabled]="sending">
        Cancel
      </button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="sendMessage()"
        [disabled]="contactForm.invalid || sending">
        @if (sending) {
          <mat-spinner diameter="20"></mat-spinner>
          <span>Sending...</span>
        } @else {
          <mat-icon>send</mat-icon>
          <span>Send Message</span>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
      color: #333;
    }

    .dialog-content {
      min-width: 500px;
      max-width: 600px;
    }

    .owner-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .owner-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e0e0e0;
    }

    .owner-details h3 {
      margin: 0 0 0.25rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .vehicle-info {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .owner-stats {
      display: flex;
      gap: 1rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: #555;
    }

    .stat mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: #667eea;
    }

    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .message-templates {
      margin-top: 1rem;
    }

    .templates-title {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: #666;
    }

    .template-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .template-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-start;
      padding: 0.5rem 1rem;
      text-align: left;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: white;
      transition: all 0.2s;
    }

    .template-btn:hover {
      background: #f5f5f5;
      border-color: #667eea;
    }

    .template-btn mat-icon {
      color: #667eea;
    }

    .privacy-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: #e3f2fd;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #1976d2;
    }

    .privacy-notice mat-icon {
      margin-top: 0.1rem;
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: #1976d2;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem 0 0 0;
    }

    .dialog-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 600px) {
      .dialog-content {
        min-width: auto;
        width: 100%;
      }

      .owner-info {
        flex-direction: column;
        text-align: center;
      }

      .owner-stats {
        justify-content: center;
      }

      .template-buttons {
        align-items: stretch;
      }
    }
  `]
})
export class ContactOwnerDialogComponent {
  contactForm: FormGroup;
  sending = false;
  showCustomMessage = false;

  constructor(
    private dialogRef: MatDialogRef<ContactOwnerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContactDialogData,
    private fb: FormBuilder,
    private supportService: SupportService,
    private tokenService: TokenService
  ) {
    this.contactForm = this.fb.group({
      subject: ['booking_inquiry', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  useTemplate(type: string) {
    const templates = {
      booking: `Hi ${this.data.owner.prenume},

I'm interested in booking your ${this.data.vehicle.firma} ${this.data.vehicle.model}. Could you please let me know about its availability?

I'm looking for a reliable vehicle and your listing caught my attention. Please let me know the next steps.

Thank you!`,
      
      availability: `Hi ${this.data.owner.prenume},

I'm planning a trip and wondering if your ${this.data.vehicle.firma} ${this.data.vehicle.model} would be available for rental.

Could you please check availability for my desired dates? I can provide more details once we connect.

Looking forward to hearing from you!`,
      
      questions: `Hi ${this.data.owner.prenume},

I have some questions about your ${this.data.vehicle.firma} ${this.data.vehicle.model} before making a booking decision.

Could we discuss the vehicle details, pickup process, and any specific requirements?

Thank you for your time!`
    };

    const subjects = {
      booking: 'booking_inquiry',
      availability: 'availability',
      questions: 'vehicle_question'
    };

    this.contactForm.patchValue({
      subject: subjects[type as keyof typeof subjects],
      message: templates[type as keyof typeof templates]
    });

    this.showCustomMessage = true;
  }

  getOwnerRating(): number {
    // Simulated rating based on loyalty points
    const baseRating = 3.5;
    const bonusRating = Math.min(this.data.owner.puncteFidelitate / 100, 1.5);
    return Math.round((baseRating + bonusRating) * 10) / 10;
  }

  sendMessage() {
    if (this.contactForm.invalid || this.sending) return;

    this.sending = true;

    const formData = this.contactForm.value;
    const subjectText = this.getSubjectText(formData.subject);
    
    // Create a support ticket that will be sent to the owner
    const supportTicket = {
      titlu: `Message about ${this.data.vehicle.firma} ${this.data.vehicle.model}: ${subjectText}`,
      comentariu: `Message from vehicle browser:

Subject: ${subjectText}
Vehicle: ${this.data.vehicle.firma} ${this.data.vehicle.model} (ID: ${this.data.vehicle.id})
Owner: ${this.data.owner.prenume} ${this.data.owner.nume}

---

${formData.message}

---

This message was sent through the Vrooom platform. You can respond by creating a support ticket or contacting the user directly.`
    };

    this.supportService.createSupportTicket(supportTicket).subscribe({
      next: () => {
        console.log('✅ Contact message sent successfully');
        this.dialogRef.close('sent');
      },
      error: (error) => {
        console.error('❌ Error sending contact message:', error);
        this.sending = false;
        // You might want to show an error message to the user here
      }
    });
  }

  private getSubjectText(subjectValue: string): string {
    const subjectMap: { [key: string]: string } = {
      'booking_inquiry': 'Booking Inquiry',
      'vehicle_question': 'Vehicle Question',
      'pricing': 'Pricing Information',
      'availability': 'Availability Check',
      'pickup_location': 'Pickup Location',
      'other': 'General Inquiry'
    };
    
    return subjectMap[subjectValue] || 'General Inquiry';
  }

  cancel() {
    this.dialogRef.close();
  }
}