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
import { TokenService } from '../../services/token.service';
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
  
  // Current admin user ID for comparison
  currentAdminId: number = 0;

  constructor(
    private adminService: AdminService,
    private supportService: SupportService,
    private tokenService: TokenService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Get current admin user ID
    const userId = this.tokenService.getUserId();
    this.currentAdminId = userId ? parseInt(userId) : 0;
  }

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
          console.log('🎫 Admin loaded tickets:', tickets);
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
    
    // Group all tickets by supportId
    this.supportTickets.forEach(ticket => {
      if (!this.groupedTickets[ticket.supportId]) {
        this.groupedTickets[ticket.supportId] = [];
      }
      this.groupedTickets[ticket.supportId].push(ticket);
    });
    
    // Sort tickets within each group for proper conversation flow
    Object.keys(this.groupedTickets).forEach(supportIdStr => {
      const supportId = parseInt(supportIdStr);
      const conversation = this.groupedTickets[supportId];
      
      // Sort by: original message first (with meaningful title), then chronological order
      conversation.sort((a, b) => {
        // Identify original user message (has title, not admin reply)
        const aIsOriginal = a.titlu && a.titlu !== '' && a.titlu !== 'Admin Reply';
        const bIsOriginal = b.titlu && b.titlu !== '' && b.titlu !== 'Admin Reply';
        
        if (aIsOriginal && !bIsOriginal) return -1;
        if (!aIsOriginal && bIsOriginal) return 1;
        
        // For replies, maintain insertion order (we don't have timestamps)
        return 0;
      });
      
      console.log(`🗂️ Admin Conversation ${supportId}:`, conversation.map(t => ({
        userId: t.userId,
        titlu: t.titlu,
        isAdmin: this.isAdminMessage(t),
        isOriginal: t.titlu && t.titlu !== '' && t.titlu !== 'Admin Reply'
      })));
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
        // Find the original ticket (with meaningful title)
        const originalTicket = this.groupedTickets[ticket.supportId]?.find(t => 
          t.titlu && t.titlu !== '' && t.titlu !== 'Admin Reply'
        ) || ticket;
        uniqueTickets.push(originalTicket);
      }
    });
    
    return uniqueTickets.sort((a, b) => b.supportId - a.supportId);
  }

  getTicketConversation(supportId: number): SupportTicket[] {
    return this.groupedTickets[supportId] || [];
  }

  // FIXED: Better logic for identifying admin vs user messages
  isAdminMessage(ticket: SupportTicket): boolean {
    // Admin messages have:
    // 1. Title is "Admin Reply" OR
    // 2. User ID is the current admin user OR
    // 3. Empty title (typical for admin replies)
    
    const isAdminReply = ticket.titlu === 'Admin Reply';
    const isFromCurrentAdmin = ticket.userId === this.currentAdminId;
    const hasNoTitle = !ticket.titlu || ticket.titlu === '';
    const isOriginalTicket = ticket.titlu && ticket.titlu !== '' && ticket.titlu !== 'Admin Reply';
    
    if (isOriginalTicket) {
      return false;
    }
    
    // Otherwise, check if it's an admin reply
    return isAdminReply || (isFromCurrentAdmin && hasNoTitle);
  }

  isUserMessage(ticket: SupportTicket): boolean {
    return !this.isAdminMessage(ticket);
  }

  replyToTicket(supportId: number) {
  const form = this.replyForms[supportId];
  if (!form || form.invalid) {
    this.showError('Please enter a valid reply (minimum 10 characters)');
    return;
  }

  const reply = form.get('reply')?.value;
  this.replyingToTicket = supportId;

  console.log(`📤 Admin replying to ticket ${supportId}:`, reply);

  this.adminService.adminReplyToTicket(supportId, reply)
    .pipe(finalize(() => this.replyingToTicket = null))
    .subscribe({
      next: (response) => {
        console.log('✅ Reply sent successfully:', response);
        this.showSuccess('Reply sent successfully! Email notification sent to user.');
        form.reset();
        
        this.supportService.sendSupportReplyEmail({
          supportId,
          titlu: 'Admin Reply',
          comentariu: reply,
          userId: this.currentAdminId
        }).subscribe({
          next: () => console.log('📧 Reply email sent'),
          error: (error) => console.error('📧 Failed to send reply email:', error)
        });
        
        this.loadAllSupportTickets();
      },
      error: (error) => {
        console.error('Error sending reply:', error);
        this.showError('Failed to send reply. Please try again.');
      }
    });
}

  markAsResolved(supportId: number) {
  console.log(`🔧 Marking ticket ${supportId} as resolved`);
  
  // Show confirmation dialog
  const confirmResolve = confirm(`Are you sure you want to mark ticket #${supportId} as resolved? This action cannot be undone.`);
  
  if (!confirmResolve) {
    return;
  }

  this.adminService.resolveTicket(supportId).subscribe({
    next: (response) => {
      console.log('✅ Ticket resolved successfully:', response);
      this.showSuccess(`Ticket #${supportId} has been marked as resolved.`);
      
      // Reload tickets to update the UI
      this.loadAllSupportTickets();
    },
    error: (error) => {
      console.error('❌ Error resolving ticket:', error);
      this.showError('Failed to resolve ticket. Please try again.');
    }
  });
}

  getTicketStatus(ticket: any): string {
  if (ticket.status) {
    return ticket.status;
  }
  
  const conversation = this.getTicketConversation(ticket.supportId);
  
  const hasAdminReply = conversation.some(t => this.isAdminMessage(t));
  
  if (hasAdminReply) {
    return 'In Progress';
  }
  
  return 'Open';
}

  getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'open': return '#ff9800'; // Orange
    case 'inprogress': 
    case 'in progress': return '#2196f3'; // Blue
    case 'resolved': return '#4caf50'; // Green
    case 'closed': return '#9e9e9e'; // Grey
    default: return '#ff9800'; // Default orange
  }
}


  getTicketPriority(ticket: SupportTicket): 'low' | 'medium' | 'high' {
    // Simple priority logic based on title keywords
    const title = ticket.titlu?.toLowerCase() || '';
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

  private calculateStats() {
  const uniqueTickets = this.getUniqueTickets();
  const totalTickets = uniqueTickets.length;
  
  let openTickets = 0;
  let resolvedTickets = 0;
  let inProgressTickets = 0;
  
  uniqueTickets.forEach(ticket => {
    const status = this.getTicketStatus(ticket);
    switch (status.toLowerCase()) {
      case 'open':
        openTickets++;
        break;
      case 'resolved':
      case 'closed':
        resolvedTickets++;
        break;
      case 'inprogress':
      case 'in progress':
        inProgressTickets++;
        break;
      default:
        openTickets++; // Default to open
    }
  });
  
  return {
    total: totalTickets,
    open: openTickets,
    inProgress: inProgressTickets,
    resolved: resolvedTickets
  };
}

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}