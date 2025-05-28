// src/app/pages/admin-support/admin-support.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { SupportService, SupportTicket } from '../../services/support.service';
import { finalize } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-support.component.html',
  styleUrls: ['./admin-support.component.scss']
})
export class AdminSupportComponent implements OnInit {
  supportTickets: SupportTicket[] = [];
  groupedTickets: { [key: number]: SupportTicket[] } = {};
  loading = true;
  error = false;
  replyingToTicket: number | null = null;
  
  replyForms: { [key: number]: FormGroup } = {};

  constructor(
    private adminService: AdminService,
    private supportService: SupportService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (!this.adminService.isAdmin()) {
      this.showError('Access denied. Admin privileges required.');
      return;
    }
    this.loadAllSupportTickets();
  }

  loadAllSupportTickets() {
    this.loading = true;
    this.error = false;

    this.adminService.getAllSupportTickets()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (tickets) => {
          this.supportTickets = tickets;
          this.groupTicketsBySupport();
          this.initializeReplyForms();
        },
        error: (error) => {
          console.error('Error loading support tickets:', error);
          this.error = true;
          this.showError('Failed to load support tickets');
        }
      });
  }

  groupTicketsBySupport() {
    this.groupedTickets = {};
    this.supportTickets.forEach(ticket => {
      if (!this.groupedTickets[ticket.supportId]) {
        this.groupedTickets[ticket.supportId] = [];
      }
      this.groupedTickets[ticket.supportId].push(ticket);
    });
    
    // Sort tickets within each group by timestamp (if you have timestamps)
    Object.keys(this.groupedTickets).forEach(supportId => {
      this.groupedTickets[parseInt(supportId)].sort((a, b) => {
        // Sort logic here - assuming supportId is roughly chronological for now
        return a.supportId - b.supportId;
      });
    });
  }

  initializeReplyForms() {
    Object.keys(this.groupedTickets).forEach(supportIdStr => {
      const supportId = parseInt(supportIdStr);
      this.replyForms[supportId] = this.fb.group({
        reply: ['', [Validators.required, Validators.minLength(10)]]
      });
    });
  }

  getUniqueTickets() {
    const uniqueTickets: SupportTicket[] = [];
    const seenSupportIds = new Set<number>();
    
    this.supportTickets.forEach(ticket => {
      if (!seenSupportIds.has(ticket.supportId)) {
        seenSupportIds.add(ticket.supportId);
        uniqueTickets.push(ticket);
      }
    });
    
    return uniqueTickets;
  }

  getTicketConversation(supportId: number): SupportTicket[] {
    return this.groupedTickets[supportId] || [];
  }

  isFromAdmin(ticket: SupportTicket): boolean {
    // You might need to add admin user ID check here
    // For now, checking if title contains 'Admin Reply'
    return ticket.titlu === 'Admin Reply' || ticket.titlu.includes('Admin');
  }

  replyToTicket(supportId: number) {
    const form = this.replyForms[supportId];
    if (!form || form.invalid) {
      this.showError('Please enter a valid reply (minimum 10 characters)');
      return;
    }

    const reply = form.get('reply')?.value;
    this.replyingToTicket = supportId;

    this.adminService.adminReplyToTicket(supportId, reply)
      .pipe(finalize(() => this.replyingToTicket = null))
      .subscribe({
        next: () => {
          this.showSuccess('Reply sent successfully!');
          form.reset();
          
          // Send reply email notification
          this.supportService.sendSupportReplyEmail({
            supportId,
            titlu: 'Admin Reply',
            comentariu: reply,
            userId: 0 // Admin user ID - you might want to get this from token
          }).subscribe({
            next: () => console.log('Reply email sent'),
            error: (error) => console.error('Failed to send reply email:', error)
          });
          
          // Reload tickets to show the new reply
          this.loadAllSupportTickets();
        },
        error: (error) => {
          console.error('Error sending reply:', error);
          this.showError('Failed to send reply. Please try again.');
        }
      });
  }

  markAsResolved(supportId: number) {
    // Implementation for marking ticket as resolved
    // This would require additional backend endpoint
    this.showSuccess(`Ticket ${supportId} marked as resolved`);
  }

  getTicketPriority(ticket: SupportTicket): 'low' | 'medium' | 'high' {
    // Simple priority logic based on title keywords
    const title = ticket.titlu.toLowerCase();
    if (title.includes('urgent') || title.includes('critical') || title.includes('bug')) {
      return 'high';
    } else if (title.includes('problem') || title.includes('issue') || title.includes('error')) {
      return 'medium';
    }
    return 'low';
  }

  getUserName(userId: number): string {
    // You might want to fetch user details from backend
    // For now, just return User ID
    return `User #${userId}`;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}