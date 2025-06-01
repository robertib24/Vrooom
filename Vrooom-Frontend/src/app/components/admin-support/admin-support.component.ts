import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { SupportService, SupportTicket } from '../../services/support.service';
import { TokenService } from '../../services/token.service';
import { finalize } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

interface ExtendedSupportTicket extends SupportTicket {
  status?: string;
  createdAt?: Date | string;
}

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-support.component.html',
  styleUrls: ['./admin-support.component.scss']
})
export class AdminSupportComponent implements OnInit, OnDestroy {
  supportTickets: ExtendedSupportTicket[] = [];
  groupedTickets: { [key: number]: ExtendedSupportTicket[] } = {};
  loading = true;
  error = false;
  replyingToTicket: number | null = null;
  
  replyForms: { [key: number]: FormGroup } = {};
  
  currentAdminId: number = 0;

  searchTerm = '';
  selectedStatusFilter = 'all';
  selectedPriorityFilter = 'all';
  userCache = new Map<number, string>();
  private searchTimeout: any; 

  constructor(
    private adminService: AdminService,
    private supportService: SupportService,
    private tokenService: TokenService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
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

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  loadAllSupportTickets() {
    this.loading = true;
    this.error = false;

    this.adminService.getAllSupportTickets()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (tickets) => {
          console.log('🎫 Admin loaded tickets:', tickets);
          // Convert to ExtendedSupportTicket with default values
          this.supportTickets = tickets.map(ticket => ({
            ...ticket,
            status: ticket.status || 'Open',
            createdAt: ticket.createdAt || new Date()
          }));
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
  
  Object.keys(this.groupedTickets).forEach(supportIdStr => {
    const supportId = parseInt(supportIdStr);
    const conversation = this.groupedTickets[supportId];
    
    conversation.sort((a, b) => {
      const aIsOriginal = a.titlu && 
                         a.titlu !== '' && 
                         a.titlu !== 'Admin Reply' && 
                         a.titlu.length > 5;
      const bIsOriginal = b.titlu && 
                         b.titlu !== '' && 
                         b.titlu !== 'Admin Reply' &&
                         b.titlu.length > 5;
      
      if (aIsOriginal && !bIsOriginal) return -1;
      if (!aIsOriginal && bIsOriginal) return 1;
      
      return 0;
    });
    
    console.log(`🗂️ Admin Conversation ${supportId} (${conversation.length} messages):`);
    conversation.forEach((t, index) => {
      console.log(`  ${index + 1}. ${this.isAdminMessage(t) ? '[ADMIN]' : '[USER]'} "${t.titlu}" - User ${t.userId}`);
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

  getUniqueTickets(): ExtendedSupportTicket[] {
    const uniqueTickets: ExtendedSupportTicket[] = [];
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

  getTicketConversation(supportId: number): ExtendedSupportTicket[] {
    return this.groupedTickets[supportId] || [];
  }

  isAdminMessage(ticket: ExtendedSupportTicket): boolean {
  const isAdminReply = ticket.titlu === 'Admin Reply';
  if (isAdminReply) {
    console.log(`🔍 Message ${ticket.supportId} identified as admin reply by title`);
    return true;
  }
  
  const isFromCurrentAdmin = ticket.userId === this.currentAdminId;
  if (isFromCurrentAdmin) {
    console.log(`🔍 Message ${ticket.supportId} from current admin user ${this.currentAdminId}`);
    return true;
  }
  
  const hasAdminPattern = ticket.titlu === '' || 
                         ticket.titlu === null || 
                         ticket.titlu === undefined ||
                         ticket.titlu.toLowerCase().includes('admin') ||
                         ticket.titlu.toLowerCase().includes('support');
  
  if (hasAdminPattern && ticket.userId !== this.getOriginalCustomerId(ticket.supportId)) {
    console.log(`🔍 Message ${ticket.supportId} identified as admin by pattern analysis`);
    return true;
  }
  
  console.log(`🔍 Message ${ticket.supportId} identified as user message`);
  return false;
}

  private getOriginalCustomerId(supportId: number): number {
  const conversation = this.getTicketConversation(supportId);
  const originalTicket = conversation.find(t => 
    t.titlu && 
    t.titlu !== 'Admin Reply' && 
    t.titlu !== '' &&
    t.titlu.length > 5
  );
  
  return originalTicket ? originalTicket.userId : 0;
}

  isUserMessage(ticket: ExtendedSupportTicket): boolean {
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
  console.log(`👤 Current admin ID: ${this.currentAdminId}`);

  this.adminService.adminReplyToTicket(supportId, reply)
    .pipe(finalize(() => this.replyingToTicket = null))
    .subscribe({
      next: (response) => {
        console.log('✅ Reply sent successfully:', response);
        this.showSuccess('Reply sent successfully! Email notification sent to customer.');
        form.reset();
        
        setTimeout(() => {
          this.loadAllSupportTickets();
        }, 1000);
      },
      error: (error) => {
        console.error('❌ Error sending reply:', error);
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

  getTicketPriority(ticket: ExtendedSupportTicket): 'low' | 'medium' | 'high' {
    // Simple priority logic based on title keywords
    const title = ticket.titlu?.toLowerCase() || '';
    if (title.includes('urgent') || title.includes('critical') || title.includes('bug')) {
      return 'high';
    } else if (title.includes('problem') || title.includes('issue') || title.includes('error')) {
      return 'medium';
    }
    return 'low';
  }
  
  getTicketsByStatus(status: string): ExtendedSupportTicket[] {
    const tickets = this.getUniqueTickets();
    if (status === 'all') return tickets;
    
    return tickets.filter(ticket => {
      const ticketStatus = this.getTicketStatus(ticket).toLowerCase();
      return ticketStatus === status.toLowerCase() || 
             (status === 'inprogress' && ticketStatus === 'in progress');
    });
  }

  getFilteredTickets(): ExtendedSupportTicket[] {
    let filtered = this.getUniqueTickets();
    
    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(ticket => 
        ticket.titlu?.toLowerCase().includes(searchLower) ||
        ticket.comentariu?.toLowerCase().includes(searchLower) ||
        ticket.supportId.toString().includes(searchLower) ||
        this.getUserDisplayName(ticket.userId).toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(ticket => {
        const status = this.getTicketStatus(ticket).toLowerCase();
        return status === this.selectedStatusFilter.toLowerCase() ||
               (this.selectedStatusFilter === 'inprogress' && status === 'in progress');
      });
    }
    
    // Apply priority filter
    if (this.selectedPriorityFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        this.getTicketPriority(ticket) === this.selectedPriorityFilter
      );
    }
    
    return filtered;
  }

  onSearchChange(): void {
    // Debounce search to avoid too many filter operations
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      // Search is applied automatically through getFilteredTickets()
    }, 300);
  }

  onStatusFilterChange(): void {
    // Status filter is applied automatically through getFilteredTickets()
  }

  onPriorityFilterChange(): void {
    // Priority filter is applied automatically through getFilteredTickets()
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedStatusFilter = 'all';
    this.selectedPriorityFilter = 'all';
  }

  // User Management Methods
  getUserDisplayName(userId: number): string {
    // Check cache first
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }
    
    // If admin user ID matches current admin, return "Admin Support"
    if (userId === this.currentAdminId) {
      const displayName = 'Admin Support';
      this.userCache.set(userId, displayName);
      return displayName;
    }
    
    // For other users, you might want to fetch user details from backend
    // For now, return a generic format
    const displayName = `User #${userId}`;
    this.userCache.set(userId, displayName);
    return displayName;
  }

  getUserName(userId: number): string {
    return this.getUserDisplayName(userId);
  }

  getTicketStatus(ticket: ExtendedSupportTicket): string {
  if (ticket.status && ticket.status !== 'Open') {
    return ticket.status;
  }
  
  const conversation = this.getTicketConversation(ticket.supportId);
  
  const hasResolved = conversation.some(t => 
    t.status?.toLowerCase() === 'resolved' ||
    t.titlu?.toLowerCase().includes('resolved')
  );
  
  if (hasResolved) {
    return 'Resolved';
  }
  
  const hasAdminReply = conversation.some(t => this.isAdminMessage(t));
  
  if (hasAdminReply) {
    return 'In Progress';
  }
  
  return 'Open';
}

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Unknown';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return dateObj.toLocaleDateString();
    }
  }

  formatMessageTime(date: Date | string | undefined): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  escalateTicket(supportId: number): void {
    const confirmation = confirm(`Are you sure you want to escalate ticket #${supportId}? This will mark it as high priority and notify senior support staff.`);
    
    if (!confirmation) return;
    
    // Here you would implement escalation logic
    // For now, just show a success message
    this.showSuccess(`Ticket #${supportId} has been escalated to senior support.`);
    
    // You might want to update the ticket priority or status
    // and reload the data
    // this.loadAllSupportTickets();
  }

  reopenTicket(supportId: number): void {
    const confirmation = confirm(`Are you sure you want to reopen ticket #${supportId}? This will change its status back to Open.`);
    
    if (!confirmation) return;
    
    if (this.adminService.reopenTicket) {
      this.adminService.reopenTicket(supportId).subscribe({
        next: (response) => {
          this.showSuccess(`Ticket #${supportId} has been reopened.`);
          this.loadAllSupportTickets();
        },
        error: (error) => {
          console.error('Error reopening ticket:', error);
          this.showError('Failed to reopen ticket. Please try again.');
        }
      });
    } else {
      this.showSuccess(`Reopen functionality for ticket #${supportId} (feature in development)`);
    }
  }

  viewTicketHistory(supportId: number): void {
    console.log(`Viewing history for ticket #${supportId}`);
    this.showSuccess(`Viewing history for ticket #${supportId} (feature coming soon)`);
  }

  resolveAllSelected(): void {
    const openTickets = this.getTicketsByStatus('open');
    
    if (openTickets.length === 0) {
      this.showError('No open tickets to resolve.');
      return;
    }
    
    const confirmation = confirm(`Are you sure you want to resolve all ${openTickets.length} open tickets? This action cannot be undone.`);
    
    if (!confirmation) return;
    
    this.showSuccess(`Resolving ${openTickets.length} tickets... (feature in development)`);
  }

  exportTickets(): void {
    const tickets = this.getFilteredTickets();
    
    if (tickets.length === 0) {
      this.showError('No tickets to export.');
      return;
    }
    
    // Create CSV content
    const csvContent = this.createTicketsCSV(tickets);
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `support-tickets-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.showSuccess(`Exported ${tickets.length} tickets to CSV.`);
  }

  private createTicketsCSV(tickets: ExtendedSupportTicket[]): string {
    const headers = ['Ticket ID', 'User ID', 'Title', 'Status', 'Priority', 'Created At', 'Message Count'];
    const rows = tickets.map(ticket => [
      ticket.supportId,
      ticket.userId,
      `"${ticket.titlu?.replace(/"/g, '""') || ''}"`,
      this.getTicketStatus(ticket),
      this.getTicketPriority(ticket),
      this.formatDate(ticket.createdAt),
      this.getTicketConversation(ticket.supportId).length
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  refreshTickets(): void {
    this.showSuccess('Refreshing ticket data...');
    this.loadAllSupportTickets();
  }

  viewAnalytics(): void {
    this.showSuccess('Analytics dashboard coming soon!');
  }

  getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'open': return '#ff9800'; // Orange
      case 'inprogress': 
      case 'in progress': return '#2196f3'; // Blue
      case 'resolved': return '#4caf50'; // Green
      case 'closed': return '#9e9e9e'; // Grey
      default: return '#ff9800'; // Default orange
    }
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