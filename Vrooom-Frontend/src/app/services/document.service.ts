import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(
    private apiService: ApiService,
    private tokenService: TokenService
  ) {}

  uploadUserDocument(documentType: 'permis' | 'carteIdentitate', file: File): Observable<any> {
    const username = this.tokenService.getUsername();
    if (!username) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.apiService.postFormData(
      `User/uploadDocument?username=${username}&document=${documentType}`,
      formData
    );
  }

  validateFile(file: File, type: 'image' | 'document'): { valid: boolean; error?: string } {
    if (type === 'image') {
      return this.validateImageFile(file);
    } else {
      return this.validateDocumentFile(file);
    }
  }

  private validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Only JPEG, PNG, and WebP files are allowed. Got: ${file.type}` 
      };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is 5MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      };
    }

    if (file.size === 0) {
      return { 
        valid: false, 
        error: 'File is empty' 
      };
    }

    return { valid: true };
  }

  private validateDocumentFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Only JPEG, PNG, and PDF files are allowed. Got: ${file.type}` 
      };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is 10MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      };
    }

    if (file.size === 0) {
      return { 
        valid: false, 
        error: 'File is empty' 
      };
    }

    return { valid: true };
  }

  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  validateMultipleFiles(files: File[], type: 'image' | 'document'): { valid: File[]; invalid: { file: File; error: string }[] } {
    const valid: File[] = [];
    const invalid: { file: File; error: string }[] = [];

    files.forEach(file => {
      const validation = this.validateFile(file, type);
      if (validation.valid) {
        valid.push(file);
      } else {
        invalid.push({ file, error: validation.error || 'Unknown error' });
      }
    });

    return { valid, invalid };
  }

  generateUniqueFileName(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || '';
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    const prefixPart = prefix ? `${prefix}_` : '';
    
    return `${prefixPart}${cleanName}_${timestamp}_${random}.${extension}`;
  }

  compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isDocumentFile(file: File): boolean {
    const documentTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return documentTypes.includes(file.type);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'pdf': 'application/pdf'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  cleanFilenameForS3(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')         
      .replace(/^_|_$/g, '');           
  }
}