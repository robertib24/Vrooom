import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupportService, SupportTicket, CreateSupportTicket } from '../../services/support.service';
import { TokenService } from '../../services/token.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule
  ],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {
  @ViewChild('supportTabs') supportTabs!: MatTabGroup;
  
  supportForm: FormGroup;
  myTickets: SupportTicket[] = [];
  groupedTickets: { [key: number]: SupportTicket[] } = {};
  loading = false;
  ticketsLoading = true;
  error = false;

  currentUserId: number = 0;
  
  knownAdminUserIds: Set<number> = new Set();

  supportTopics = [
    { icon: 'help', title: 'General Questions', description: 'General inquiries about our service' },
    { icon: 'payment', title: 'Billing & Payments', description: 'Issues with payments or billing' },
    { icon: 'directions_car', title: 'Vehicle Issues', description: 'Problems with vehicle listings or bookings' },
    { icon: 'account_circle', title: 'Account Help', description: 'Account settings and profile issues' },
    { icon: 'security', title: 'Safety & Security', description: 'Report safety concerns or security issues' },
    { icon: 'bug_report', title: 'Technical Issues', description: 'Website bugs or technical problems' }
  ];

  quickTitles: { [key: string]: string[] } = {
    'General Questions': [
      'How does car rental work?',
      'What are the requirements to rent?',
      'How do I cancel a booking?'
    ],
    'Billing & Payments': [
      'Payment was declined',
      'Refund request',
      'Billing inquiry'
    ],
    'Vehicle Issues': [
      'Vehicle not as described',
      'Vehicle unavailable',
      'Listing problem'
    ],
    'Account Help': [
      'Cannot access my account',
      'Update profile information',
      'Delete my account'
    ],
    'Safety & Security': [
      'Report unsafe vehicle',
      'Report inappropriate behavior',
      'Security concern'
    ],
    'Technical Issues': [
      'Website not working',
      'App crashing',
      'Feature not working'
    ]
  };

  selectedTopic = '';
  selectedQuickTitle = '';

  constructor(
    private fb: FormBuilder,
    private supportService: SupportService,
    private tokenService: TokenService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.supportForm = this.fb.group({
      titlu: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      comentariu: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]]
    });

    // Get current user ID
    const userId = this.tokenService.getUserId();
    this.currentUserId = userId ? parseInt(userId) : 0;
    
    console.log('🔑 Current user ID:', this.currentUserId);
  }

  ngOnInit() {
    this.loadMyTickets();
  }

  loadMyTickets() {
    this.ticketsLoading = true;
    this.error = false;

    const userId = this.tokenService.getUserId();
    if (!userId) {
      this.error = true;
      this.ticketsLoading = false;
      return;
    }

    this.supportService.getSupportTicketsByUserId()
      .pipe(finalize(() => this.ticketsLoading = false))
      .subscribe({
        next: (tickets) => {
          console.log('📋 Loaded tickets:', tickets);
          this.myTickets = tickets.sort((a, b) => b.supportId - a.supportId);
          this.detectAdminUsers();
          this.groupTicketsByConversation();
        },
        error: (error) => {
          console.error('Error loading tickets:', error);
          this.error = true;
          this.showError('Failed to load your support tickets');
        }
      });
  }

  detectAdminUsers() {
    console.log('🕵️ Detecting admin users from ticket patterns...');
    
    this.knownAdminUserIds.clear();
    
    const tempGrouped: { [key: number]: SupportTicket[] } = {};
    this.myTickets.forEach(ticket => {
      if (!tempGrouped[ticket.supportId]) {
        tempGrouped[ticket.supportId] = [];
      }
      tempGrouped[ticket.supportId].push(ticket);
    });

    Object.values(tempGrouped).forEach(conversation => {
      const originalMessage = conversation.find(ticket => 
        ticket.userId === this.currentUserId && 
        ticket.titlu && 
        ticket.titlu.length > 5 && 
        ticket.titlu !== 'Admin Reply' &&
        !ticket.titlu.toLowerCase().includes('reply')
      );

      if (originalMessage) {
        conversation.forEach(ticket => {
          if (ticket.userId !== this.currentUserId) {
            this.knownAdminUserIds.add(ticket.userId);
            console.log(`🔍 Detected admin user ID: ${ticket.userId} (from ticket ${ticket.supportId})`);
          }
          
          if (ticket.titlu === 'Admin Reply') {
            this.knownAdminUserIds.add(ticket.userId);
            console.log(`🔍 Detected admin user ID: ${ticket.userId} (Admin Reply title)`);
          }
        });
      }
    });

    console.log('🎯 Known admin user IDs:', Array.from(this.knownAdminUserIds));
  }

  groupTicketsByConversation() {
    this.groupedTickets = {};
    
    this.myTickets.forEach(ticket => {
      if (!this.groupedTickets[ticket.supportId]) {
        this.groupedTickets[ticket.supportId] = [];
      }
      this.groupedTickets[ticket.supportId].push(ticket);
    });

    Object.keys(this.groupedTickets).forEach(supportIdStr => {
      const supportId = parseInt(supportIdStr);
      const conversation = this.groupedTickets[supportId];
      
      conversation.sort((a, b) => {
        const aIsOriginal = this.isOriginalUserMessage(a);
        const bIsOriginal = this.isOriginalUserMessage(b);
        
        if (aIsOriginal && !bIsOriginal) return -1;
        if (!aIsOriginal && bIsOriginal) return 1;
        
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        
        return 0; 
      });
      
      console.log(`🗂️ Conversation ${supportId} (${conversation.length} messages):`);
      conversation.forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${this.isAdminMessage(ticket) ? '[ADMIN]' : '[USER]'} User ${ticket.userId}: "${ticket.titlu}" - ${ticket.comentariu.slice(0, 50)}...`);
      });
    });
  }

  isAdminMessage(ticket: SupportTicket): boolean {
    if (this.knownAdminUserIds.has(ticket.userId)) {
      console.log(`✅ ADMIN: User ${ticket.userId} is in known admin list`);
      return true;
    }
    
    if (ticket.titlu === 'Admin Reply') {
      console.log(`✅ ADMIN: Has "Admin Reply" title`);
      return true;
    }
    
    if (ticket.userId !== this.currentUserId) {
      const conversation = this.groupedTickets[ticket.supportId] || [];
      const hasOriginalFromCurrentUser = conversation.some(t => this.isOriginalUserMessage(t));
      
      if (hasOriginalFromCurrentUser) {
        console.log(`✅ ADMIN: Different user in conversation started by current user`);
        return true;
      }
    }
    
    console.log(`❌ USER: User ${ticket.userId} message - "${ticket.titlu || 'no title'}"`);
    return false;
  }

  isOriginalUserMessage(ticket: SupportTicket): boolean {
    if (!ticket.titlu) return false;
    
    return ticket.userId === this.currentUserId && 
           ticket.titlu.length > 5 && 
           ticket.titlu !== 'Admin Reply' &&
           !ticket.titlu.toLowerCase().includes('reply') &&
           ticket.titlu.trim() !== '';
  }

  isUserMessage(ticket: SupportTicket): boolean {
    return !this.isAdminMessage(ticket);
  }

  isAdminReply(ticket: SupportTicket): boolean {
    return this.isAdminMessage(ticket);
  }

  selectTopic(topic: string) {
    this.selectedTopic = topic;
    this.selectedQuickTitle = '';
  }

  selectQuickTitle(title: string) {
    this.selectedQuickTitle = title;
    this.supportForm.patchValue({ titlu: title });
  }

  onSubmit() {
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const ticketData: Omit<CreateSupportTicket, 'userId'> = {
      titlu: this.supportForm.get('titlu')?.value,
      comentariu: this.supportForm.get('comentariu')?.value
    };

    this.supportService.createSupportTicket(ticketData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.showSuccess('Support ticket created successfully! We\'ll get back to you soon.');
          this.supportForm.reset();
          this.selectedTopic = '';
          this.selectedQuickTitle = '';
          
          this.supportService.sendSupportCreatedEmail({
            supportId: 0,
            titlu: ticketData.titlu,
            comentariu: ticketData.comentariu,
            userId: parseInt(this.tokenService.getUserId() || '0')
          }).subscribe();

          this.loadMyTickets();
        },
        error: (error) => {
          console.error('Error creating support ticket:', error);
          this.showError('Failed to create support ticket. Please try again.');
        }
      });
  }

  openReplyDialog(conversationId: number) {
    const conversation = this.groupedTickets[conversationId];
    if (!conversation) return;

    const dialogRef = this.dialog.open(SupportReplyDialog, {
      width: '600px',
      data: {
        conversationId,
        conversation,
        originalTitle: this.getConversationTitle(conversationId),
        currentUserId: this.currentUserId,
        knownAdminUserIds: Array.from(this.knownAdminUserIds)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMyTickets();
      }
    });
  }

  getConversationIds(): number[] {
    return Object.keys(this.groupedTickets)
      .map(key => parseInt(key))
      .sort((a, b) => b - a);
  }

  getGroupedTicketsCount(): number {
    return Object.keys(this.groupedTickets).length;
  }

  getConversationTitle(conversationId: number): string {
    const conversation = this.groupedTickets[conversationId];
    
    const originalMessage = conversation?.find(t => this.isOriginalUserMessage(t));
    
    return originalMessage?.titlu || `Ticket #${conversationId}`;
  }

  getConversationPreview(conversationId: number): string {
    const conversation = this.groupedTickets[conversationId];
    const lastMessage = conversation?.[conversation.length - 1];
    return lastMessage?.comentariu?.slice(0, 100) + (lastMessage?.comentariu?.length > 100 ? '...' : '') || '';
  }

  getMessageCount(conversationId: number): number {
    return this.groupedTickets[conversationId]?.length || 0;
  }

  get formControls() {
    return this.supportForm.controls;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
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

@Component({
  selector: 'app-support-reply-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon>chat</mat-icon>
      {{ data.originalTitle }}
    </h2>
    
    <mat-dialog-content class="reply-dialog-content">
      <!-- Conversation History -->
      <div class="conversation-history">
        <h3>Conversation History</h3>
        <div class="messages">
          @for (message of data.conversation; track message.supportId + '-' + message.comentariu.slice(0,10)) {
            <div class="message" 
                 [class.user-message]="isUserMessage(message)" 
                 [class.support-message]="isAdminMessage(message)">
              <div class="message-header">
                <mat-icon>{{ isAdminMessage(message) ? 'support_agent' : 'person' }}</mat-icon>
                <span class="sender">{{ isAdminMessage(message) ? 'Vrooom Support' : 'You' }}</span>
                <span class="user-id-debug">(ID: {{ message.userId }})</span>
                @if (message.titlu && message.titlu !== 'Admin Reply') {
                  <span class="message-title"> - {{ message.titlu }}</span>
                }
              </div>
              <div class="message-content">
                {{ message.comentariu }}
              </div>
            </div>
          }
        </div>
      </div>
      
      <!-- Reply Form -->
      <div class="reply-section">
        <h3>Add Reply</h3>
        <form [formGroup]="replyForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Reply</mat-label>
            <textarea 
              matInput 
              formControlName="reply" 
              rows="4"
              placeholder="Type your response here..."></textarea>
            <mat-icon matSuffix>message</mat-icon>
            @if (formControls['reply'].errors?.['required'] && formControls['reply'].touched) {
              <mat-error>Reply is required</mat-error>
            }
            @if (formControls['reply'].errors?.['minlength'] && formControls['reply'].touched) {
              <mat-error>Reply must be at least 10 characters</mat-error>
            }
          </mat-form-field>
        </form>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      @if (loading) {
        <button mat-raised-button color="primary" disabled>
          <mat-spinner diameter="20"></mat-spinner>
          Sending...
        </button>
      } @else {
        <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="replyForm.invalid">
          <mat-icon>send</mat-icon>
          Send Reply
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .reply-dialog-content {
      min-width: 500px;
      max-height: 600px;
      
      .conversation-history {
        margin-bottom: 2rem;
        
        h3 {
          color: #333;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        
        .messages {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          
          .message {
            margin-bottom: 1rem;
            padding: 1rem;
            border-radius: 8px;
            
            &.user-message {
              background: #e3f2fd;
              margin-left: 2rem;
              border-left: 4px solid #2196f3;
            }
            
            &.support-message {
              background: #f3e5f5;
              margin-right: 2rem;
              border-left: 4px solid #9c27b0;
            }
            
            .message-header {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-bottom: 0.5rem;
              font-weight: 600;
              font-size: 0.9rem;
              
              mat-icon {
                font-size: 1.2rem;
                width: 1.2rem;
                height: 1.2rem;
              }
              
              .user-id-debug {
                font-size: 0.7rem;
                color: #999;
                font-weight: normal;
                opacity: 0.7;
              }
              
              .message-title {
                font-style: italic;
                color: #666;
              }
            }
            
            .message-content {
              line-height: 1.5;
              color: #333;
              white-space: pre-wrap;
            }
          }
        }
      }
      
      .reply-section {
        h3 {
          color: #333;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        
        .full-width {
          width: 100%;
        }
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class SupportReplyDialog {
  replyForm: FormGroup;
  loading = false;
  knownAdminUserIds: Set<number>;

  constructor(
    private fb: FormBuilder,
    private supportService: SupportService,
    private tokenService: TokenService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SupportReplyDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.replyForm = this.fb.group({
      reply: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]]
    });
    
    this.knownAdminUserIds = new Set(this.data.knownAdminUserIds || []);
    
    console.log('🔑 Dialog - Current user ID:', this.data.currentUserId);
    console.log('🎯 Dialog - Known admin IDs:', Array.from(this.knownAdminUserIds));
  }

  isAdminMessage(message: any): boolean {
    if (this.knownAdminUserIds.has(message.userId)) {
      return true;
    }
    
    if (message.titlu === 'Admin Reply') {
      return true;
    }
    
    if (message.userId !== this.data.currentUserId) {
      return true;
    }
    
    return false;
  }

  isUserMessage(message: any): boolean {
    return !this.isAdminMessage(message);
  }

  onSubmit() {
    if (this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const replyText = this.replyForm.get('reply')?.value;

    this.supportService.replySupportTicket(this.data.conversationId, replyText)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.showSuccess('Reply sent successfully!');
          
          this.supportService.sendSupportReplyEmail({
            supportId: this.data.conversationId,
            titlu: this.data.originalTitle,
            comentariu: replyText,
            userId: parseInt(this.tokenService.getUserId() || '0')
          }).subscribe();

          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error sending reply:', error);
          this.showError('Failed to send reply. Please try again.');
        }
      });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  get formControls() {
    return this.replyForm.controls;
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