import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { VehiclesService } from '../../services/vehicles.service';
import { TokenService } from '../../services/token.service';
import { DocumentService } from '../../services/document.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-add-vehicle',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatChipsModule
  ],
  templateUrl: './add-vehicle.component.html',
  styleUrls: ['./add-vehicle.component.scss']
})
export class AddVehicleComponent implements OnInit, OnDestroy {
  // Form groups for stepper
  basicInfoForm: FormGroup;
  detailsForm: FormGroup;
  documentsForm: FormGroup;
  imagesForm: FormGroup;

  // Loading states
  loading = false;
  enhancingDescription = false;
  uploadingImages = false;

  // Image handling
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  maxImages = 10;

  // Document handling
  selectedDocuments: { [key: string]: File | null } = {
    talon: null,
    carteIdentitateMasina: null,
    asigurare: null
  };

  // Form data
  carBrands = [
    'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Toyota', 'Honda',
    'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Mazda',
    'Subaru', 'Mitsubishi', 'Peugeot', 'Renault', 'Citroën', 'Dacia',
    'Skoda', 'Seat', 'Fiat', 'Alfa Romeo', 'Lancia', 'Ferrari',
    'Lamborghini', 'Maserati', 'Porsche', 'Bentley', 'Rolls-Royce',
    'Jaguar', 'Land Rover', 'Mini', 'Volvo', 'Saab', 'Tesla',
    'Lexus', 'Infiniti', 'Acura', 'Genesis', 'Jeep', 'Cadillac',
    'Lincoln', 'Buick', 'GMC', 'Dodge', 'Chrysler', 'Ram',
    'Trabant', 'Lada', 'Other'
  ];

  carColors = [
    { value: 'white', label: 'White / Alb' },
    { value: 'black', label: 'Black / Negru' },
    { value: 'silver', label: 'Silver / Argintiu' },
    { value: 'gray', label: 'Gray / Gri' },
    { value: 'red', label: 'Red / Roșu' },
    { value: 'blue', label: 'Blue / Albastru' },
    { value: 'green', label: 'Green / Verde' },
    { value: 'yellow', label: 'Yellow / Galben' },
    { value: 'orange', label: 'Orange / Portocaliu' },
    { value: 'brown', label: 'Brown / Maro' },
    { value: 'beige', label: 'Beige / Bej' },
    { value: 'gold', label: 'Gold / Auriu' },
    { value: 'purple', label: 'Purple / Mov' },
    { value: 'pink', label: 'Pink / Roz' }
  ];

  currentYear = new Date().getFullYear();
  years = Array.from({length: this.currentYear - 1950 + 1}, (_, i) => this.currentYear - i);

  constructor(
    private fb: FormBuilder,
    private vehiclesService: VehiclesService,
    private tokenService: TokenService,
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Initialize forms in constructor body
    this.basicInfoForm = this.fb.group({
      titlu: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      firma: ['', Validators.required],
      model: ['', [Validators.required, Validators.minLength(2)]],
      anFabricatie: ['', [Validators.required, Validators.min(1950), Validators.max(this.currentYear)]],
      culoare: ['', Validators.required],
      pret: ['', [Validators.required, Validators.min(1), Validators.max(10000)]]
    });

    this.detailsForm = this.fb.group({
      descriere: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      kilometraj: ['', [Validators.required, Validators.min(0), Validators.max(1000000)]],
      locatie: ['', [Validators.required, Validators.minLength(5)]]
    });

    this.documentsForm = this.fb.group({
      talon: [''],
      carteIdentitateMasina: [''],
      asigurare: ['']
    });

    this.imagesForm = this.fb.group({
      imagini: [[], [this.minImagesValidator.bind(this)]]
    });
  }

  ngOnInit() {
    this.checkUserPermissions();
  }



  private checkUserPermissions() {
    const username = this.tokenService.getUsername();
    if (!username) {
      this.router.navigate(['/login']);
    }
  }

  // Custom validator for minimum images
  private minImagesValidator(control: AbstractControl): ValidationErrors | null {
    const images = this.selectedImages || [];
    return images.length >= 3 ? null : { minImages: { required: 3, actual: images.length } };
  }

  // Image handling methods
  async onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    
    // Validate total number of images
    if (this.selectedImages.length + files.length > this.maxImages) {
      this.showError(`Maximum ${this.maxImages} images allowed`);
      input.value = '';
      return;
    }

    // Use DocumentService for validation
    const validation = this.documentService.validateMultipleFiles(files, 'image');
    
    // Show errors for invalid files
    if (validation.invalid.length > 0) {
      validation.invalid.forEach(({ file, error }) => {
        this.showError(`${file.name}: ${error}`);
      });
    }

    // Process valid files
    if (validation.valid.length > 0) {
      await this.processValidImages(validation.valid);
    }

    // Clear the input
    input.value = '';
  }

  private async processValidImages(files: File[]) {
    this.uploadingImages = true;
    
    try {
      for (const file of files) {
        // Compress large images using DocumentService
        const processedFile = await this.documentService.compressImage(file, 1920, 1080, 0.85);
        
        // Add to selected images
        this.selectedImages.push(processedFile);
        
        // Generate preview using DocumentService
        const previewUrl = await this.documentService.createImagePreview(processedFile);
        this.imagePreviewUrls.push(previewUrl);
      }

      // Update form
      this.imagesForm.patchValue({ imagini: this.selectedImages });
      this.imagesForm.get('imagini')?.updateValueAndValidity();
      
      this.showSuccess(`${files.length} image(s) processed and added successfully`);
      
    } catch (error) {
      console.error('Error processing images:', error);
      this.showError('Failed to process some images');
    } finally {
      this.uploadingImages = false;
    }
  }

  removeImage(index: number) {
    if (index >= 0 && index < this.selectedImages.length) {
      this.selectedImages.splice(index, 1);
      
      // Clean up preview URL to prevent memory leaks
      if (this.imagePreviewUrls[index]) {
        URL.revokeObjectURL(this.imagePreviewUrls[index]);
        this.imagePreviewUrls.splice(index, 1);
      }
      
      // Update form
      this.imagesForm.patchValue({ imagini: this.selectedImages });
      this.imagesForm.get('imagini')?.updateValueAndValidity();
    }
  }

  // Document upload methods
  onDocumentSelected(event: Event, documentType: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    
    // Use DocumentService for validation
    const validation = this.documentService.validateFile(file, 'document');
    if (validation.valid) {
      this.selectedDocuments[documentType] = file;
      this.documentsForm.patchValue({ [documentType]: file.name });
      this.showSuccess(`${documentType} document selected: ${file.name} (${this.documentService.formatFileSize(file.size)})`);
    } else {
      this.showError(`${file.name}: ${validation.error}`);
    }

    // Clear the input
    input.value = '';
  }

  // AI Description Enhancement
  enhanceDescription() {
    const currentDescription = this.detailsForm.get('descriere')?.value || '';
    const brand = this.basicInfoForm.get('firma')?.value || '';
    const model = this.basicInfoForm.get('model')?.value || '';
    const year = this.basicInfoForm.get('anFabricatie')?.value || '';

    let prompt = currentDescription;
    if (!prompt && brand && model) {
      prompt = `${brand} ${model} ${year}`;
    }

    if (!prompt) {
      this.showError('Please enter a basic description or select brand/model first');
      return;
    }

    this.enhancingDescription = true;
    
    this.vehiclesService.enhanceDescription(prompt)
      .pipe(finalize(() => this.enhancingDescription = false))
      .subscribe({
        next: (response) => {
          if (response.prompt && response.prompt !== "I don't know how to respond") {
            this.detailsForm.patchValue({ descriere: response.prompt });
            this.showSuccess('✨ Description enhanced successfully!');
          } else {
            this.showError('Could not enhance description. Please provide more details.');
          }
        },
        error: (error) => {
          console.error('Error enhancing description:', error);
          this.showError('Failed to enhance description. Please try again.');
        }
      });
  }

  // Form submission
  onSubmit() {
    // Validate all forms
    if (!this.isFormValid()) {
      this.markAllFormsAsTouched();
      this.showError('Please fill in all required fields');
      return;
    }

    // Check minimum images requirement
    if (this.selectedImages.length < 3) {
      this.showError('Please upload at least 3 photos of your vehicle');
      return;
    }

    this.loading = true;

    // Prepare vehicle data
    const vehicleData = {
      userId: parseInt(this.tokenService.getUserId() || '0'),
      ...this.basicInfoForm.value,
      ...this.detailsForm.value,
      // Use document names as placeholders since backend expects strings
      talon: this.selectedDocuments['talon']?.name || 'vehicle_registration.pdf',
      carteIdentitateMasina: this.selectedDocuments['carteIdentitateMasina']?.name || 'vehicle_identity.pdf',
      asigurare: this.selectedDocuments['asigurare']?.name || 'vehicle_insurance.pdf'
    };

    console.log('Submitting vehicle data:', vehicleData);
    console.log('Selected images count:', this.selectedImages.length);
    console.log('Total images size:', this.calculateTotalImageSize());

    // Submit to backend
    this.vehiclesService.addVehicle(vehicleData, this.selectedImages)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (vehicleId) => {
          console.log('Vehicle added successfully with ID:', vehicleId);
          this.showSuccess('🎉 Vehicle listed successfully! Your listing is now live.');
          
          // Clean up image previews
          this.cleanupImagePreviews();
          
          // Navigate to the new vehicle details or vehicles list
          setTimeout(() => {
            if (vehicleId && typeof vehicleId === 'number') {
              this.router.navigate(['/vehicle', vehicleId]);
            } else {
              this.router.navigate(['/vehicles']);
            }
          }, 2000);
        },
        error: (error) => {
          console.error('Error adding vehicle:', error);
          this.handleSubmissionError(error);
        }
      });
  }

  private calculateTotalImageSize(): string {
    const totalBytes = this.selectedImages.reduce((sum, file) => sum + file.size, 0);
    return this.documentService.formatFileSize(totalBytes);
  }

  private cleanupImagePreviews() {
    this.imagePreviewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  private handleSubmissionError(error: any) {
    let errorMessage = 'Failed to list vehicle. Please try again.';
    
    if (error.status === 400) {
      errorMessage = 'Invalid data provided. Please check all fields.';
    } else if (error.status === 413) {
      errorMessage = 'Files are too large. Please reduce image sizes or quantity.';
    } else if (error.status === 422) {
      errorMessage = 'Color validation failed. Please select a valid color from the list.';
    } else if (error.status === 401) {
      errorMessage = 'You are not authorized. Please log in again.';
      this.router.navigate(['/login']);
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.showError(errorMessage);
  }

  isFormValid(): boolean {
    return this.basicInfoForm.valid && 
           this.detailsForm.valid && 
           this.imagesForm.valid;
    // Documents are optional for now
  }

   markAllFormsAsTouched() {
    this.basicInfoForm.markAllAsTouched();
    this.detailsForm.markAllAsTouched();
    this.documentsForm.markAllAsTouched();
    this.imagesForm.markAllAsTouched();
  }

  // Utility methods
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

  get basicInfoFormControls() {
    return this.basicInfoForm.controls;
  }

  get detailsFormControls() {
    return this.detailsForm.controls;
  }

  get documentsFormControls() {
    return this.documentsForm.controls;
  }

  get imagesFormControls() {
    return this.imagesForm.controls;
  }

  // Helper methods for template
  getDocumentName(documentType: string): string {
    const file = this.selectedDocuments[documentType];
    return file ? `${file.name} (${this.documentService.formatFileSize(file.size)})` : '';
  }

  hasDocument(documentType: string): boolean {
    return !!this.selectedDocuments[documentType];
  }

  getTotalImagesSize(): string {
    return this.calculateTotalImageSize();
  }

  // Cleanup on component destroy
  ngOnDestroy() {
    this.cleanupImagePreviews();
  }
}