import { Component } from '@angular/core';
import { MatSnackBarLabel } from '@angular/material/snack-bar';

@Component({
  selector: 'app-snackbar',
  imports: [MatSnackBarLabel],
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss',
})
export class SnackbarComponent {}
