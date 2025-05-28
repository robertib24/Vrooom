import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AdminService, AdminVehicle, AdminUser, AdminStats } from '../../services/admin.service';
import { VehiclesService } from '../../services/vehicles.service';
import { TokenService } from '../../services/token.service';
import { finalize } from 'rxjs/operators';
import { MatOptionModule } from "@angular/material/core";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatOptionModule
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  // Loading states
  loading = true;
  vehiclesLoading = false;
  usersLoading = false;
  
  // Data
  adminStats: AdminStats | null = null;
  vehicles: AdminVehicle[] = [];
  users: AdminUser[] = [];
  
  // Pagination
  vehiclesPageSize = 10;
  vehiclesPageIndex = 0;
  totalVehicles = 0;
  
  usersPageSize = 10;
  usersPageIndex = 0;
  totalUsers = 0;
  
  // Table columns
  vehicleColumns = ['image', 'title', 'owner', 'price', 'status', 'createdDate', 'actions'];
  userColumns = ['avatar', 'name', 'email', 'role', 'joinDate', 'vehicles', 'actions'];
  
  // Filters
  vehicleFilter = '';
  userFilter = '';
  statusFilter = 'all';
  
  // Action states
  deletingVehicleId: number | null = null;
  updatingUserId: number | null = null;

  constructor(
    private adminService: AdminService,
    private vehiclesService: VehiclesService,
    private tokenService: TokenService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAdminPermissions();
    this.loadAdminData();
  }

  checkAdminPermissions() {
    const userRole = this.tokenService.getRole();
    if (userRole !== 'Admin') {
      this.showError('Access denied. Admin privileges required.');
      this.router.navigate(['/landing']);
      return;
    }
  }

  loadAdminData() {
    this.loading = true;
    
    // Load admin stats
    this.adminService.getAdminStats()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (stats) => {
          this.adminStats = stats;
        },
        error: (error) => {
          console.error('Error loading admin stats:', error);
          this.showError('Failed to load admin statistics');
        }
      });
    
    // Load vehicles and users
    this.loadVehicles();
    this.loadUsers();
  }

  loadVehicles() {
    this.vehiclesLoading = true;
    
    this.adminService.getAllVehicles(
      this.vehiclesPageIndex,
      this.vehiclesPageSize,
      this.vehicleFilter,
      this.statusFilter
    )
    .pipe(finalize(() => this.vehiclesLoading = false))
    .subscribe({
      next: (response) => {
        this.vehicles = response.vehicles;
        this.totalVehicles = response.total;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.showError('Failed to load vehicles');
      }
    });
  }

  loadUsers() {
    this.usersLoading = true;
    
    this.adminService.getAllUsers(
      this.usersPageIndex,
      this.usersPageSize,
      this.userFilter
    )
    .pipe(finalize(() => this.usersLoading = false))
    .subscribe({
      next: (response) => {
        this.users = response.users;
        this.totalUsers = response.total;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.showError('Failed to load users');
      }
    });
  }

  // Vehicle actions
  viewVehicle(vehicle: AdminVehicle) {
    this.router.navigate(['/vehicle', vehicle.id]);
  }

  confirmDeleteVehicle(vehicle: AdminVehicle) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: {
        title: 'Delete Vehicle',
        message: `Are you sure you want to delete "${vehicle.titlu}"?`,
        warning: 'This action cannot be undone. All related bookings and reviews will also be deleted.',
        confirmText: 'Delete Vehicle',
        item: vehicle
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteVehicle(vehicle.id);
      }
    });
  }

  deleteVehicle(vehicleId: number) {
    this.deletingVehicleId = vehicleId;
    
    this.adminService.deleteVehicle(vehicleId)
      .pipe(finalize(() => this.deletingVehicleId = null))
      .subscribe({
        next: () => {
          this.showSuccess('Vehicle deleted successfully');
          this.loadVehicles();
          this.loadAdminData(); // Refresh stats
        },
        error: (error) => {
          console.error('Error deleting vehicle:', error);
          this.showError('Failed to delete vehicle');
        }
      });
  }

  toggleVehicleStatus(vehicle: AdminVehicle) {
    const newStatus = vehicle.status === 'active' ? 'suspended' : 'active';
    
    this.adminService.updateVehicleStatus(vehicle.id, newStatus)
      .subscribe({
        next: () => {
          vehicle.status = newStatus;
          const action = newStatus === 'active' ? 'activated' : 'suspended';
          this.showSuccess(`Vehicle ${action} successfully`);
        },
        error: (error) => {
          console.error('Error updating vehicle status:', error);
          this.showError('Failed to update vehicle status');
        }
      });
  }

  // User actions
  viewUserProfile(user: AdminUser) {
    this.router.navigate(['/profile'], { queryParams: { userId: user.id } });
  }

  openUserRoleDialog(user: AdminUser) {
    const dialogRef = this.dialog.open(ChangeUserRoleDialog, {
      width: '400px',
      data: {
        user: user,
        currentRole: user.role
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result !== user.role) {
        this.changeUserRole(user.id, result);
      }
    });
  }

  changeUserRole(userId: number, newRole: string) {
    this.updatingUserId = userId;
    
    this.adminService.updateUserRole(userId, newRole)
      .pipe(finalize(() => this.updatingUserId = null))
      .subscribe({
        next: () => {
          this.showSuccess(`User role updated to ${newRole}`);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user role:', error);
          this.showError('Failed to update user role');
        }
      });
  }

  suspendUser(user: AdminUser) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: {
        title: 'Suspend User',
        message: `Are you sure you want to suspend "${user.nume} ${user.prenume}"?`,
        warning: 'The user will not be able to access the platform until unsuspended.',
        confirmText: 'Suspend User',
        item: user
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.adminService.suspendUser(user.id)
          .subscribe({
            next: () => {
              this.showSuccess('User suspended successfully');
              this.loadUsers();
            },
            error: (error) => {
              console.error('Error suspending user:', error);
              this.showError('Failed to suspend user');
            }
          });
      }
    });
  }

  // Pagination
  onVehiclesPageChange(event: PageEvent) {
    this.vehiclesPageIndex = event.pageIndex;
    this.vehiclesPageSize = event.pageSize;
    this.loadVehicles();
  }

  onUsersPageChange(event: PageEvent) {
    this.usersPageIndex = event.pageIndex;
    this.usersPageSize = event.pageSize;
    this.loadUsers();
  }

  // Filters
  applyVehicleFilter() {
    this.vehiclesPageIndex = 0;
    this.loadVehicles();
  }

  applyUserFilter() {
    this.usersPageIndex = 0;
    this.loadUsers();
  }

  clearVehicleFilter() {
    this.vehicleFilter = '';
    this.statusFilter = 'all';
    this.vehiclesPageIndex = 0;
    this.loadVehicles();
  }

  clearUserFilter() {
    this.userFilter = '';
    this.usersPageIndex = 0;
    this.loadUsers();
  }

  // Utility methods
  getVehicleImageUrl(vehicleId: number): string {
    return this.vehiclesService.getVehicleImageUrl(vehicleId);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'suspended': return 'warn';
      case 'pending': return 'accent';
      default: return '';
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'Admin': return 'warn';
      case 'Proprietar': return 'primary';
      case 'Chirias': return 'accent';
      default: return '';
    }
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
  }

  // Notification methods
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

// Confirm Delete Dialog
@Component({
  selector: 'app-confirm-delete-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <ng-container *ngIf="data.warning">
        <div class="warning">
          <mat-icon color="warn">warning</mat-icon>
          <span>{{ data.warning }}</span>
        </div>
      </ng-container>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
    .warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #fff3cd;
      border-radius: 4px;
      color: #856404;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule]
})
export class ConfirmDeleteDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

// Change User Role Dialog
@Component({
  selector: 'app-change-user-role-dialog',
  template: `
    <h2 mat-dialog-title>Change User Role</h2>
    <mat-dialog-content>
      <p>Change role for <strong>{{ data.user.nume }} {{ data.user.prenume }}</strong></p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Select Role</mat-label>
        <mat-select [formControl]="roleControl">
          <mat-option value="Default">Default User</mat-option>
          <mat-option value="Chirias">Chirias (Renter)</mat-option>
          <mat-option value="Proprietar">Proprietar (Owner)</mat-option>
          <mat-option value="Admin">Admin</mat-option>
        </mat-select>
      </mat-form-field>
      
      <div class="role-description">
        <strong>Role Permissions:</strong>
        <ng-container [ngSwitch]="roleControl.value">
          <p *ngSwitchCase="'Default'">Basic access to browse vehicles.</p>
          <p *ngSwitchCase="'Chirias'">Can browse and rent vehicles.</p>
          <p *ngSwitchCase="'Proprietar'">Can list vehicles for rent and browse other vehicles.</p>
          <p *ngSwitchCase="'Admin'"><strong>Full administrative access including user and vehicle management.</strong></p>
        </ng-container>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="roleControl.value === data.currentRole"
              (click)="onConfirm()">
        Update Role
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
    .full-width { width: 100%; }
    .role-description {
      margin-top: 1rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .role-description p {
      margin: 0;
      color: #666;
    }
  `],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule
  ]
})
export class ChangeUserRoleDialog {
  roleControl: FormControl;

  constructor(
    public dialogRef: MatDialogRef<ChangeUserRoleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.roleControl = new FormControl(this.data.currentRole);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.roleControl.value);
  }
}