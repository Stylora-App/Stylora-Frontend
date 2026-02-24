import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  wardrobeService = inject(WardrobeService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isEditing = signal(false);
  displayName = signal('');
  preferredStyle = signal('');

  // Change password modal state
  showChangePasswordModal = signal(false);
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  isChangingPassword = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Profile picture upload state
  isUploadingPicture = signal(false);

  // Direct reference to service signal for reactivity
  get userProfile() {
    return this.wardrobeService.userProfile;
  }
  
  // Generate CSS gradient from palette colors for the avatar background
  avatarGradient = computed(() => {
    const palette = this.wardrobeService.userProfile().palette || [];
    
    // Default gradient if no palette
    if (palette.length === 0) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    if (palette.length === 1) {
      return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[0]} 100%)`;
    }
    
    // Create a diagonal gradient from palette colors (use up to 3 colors)
    const stops = palette.slice(0, 3).map((color, index, arr) => {
      const position = (index / (arr.length - 1)) * 100;
      return `${color} ${position}%`;
    }).join(', ');
    
    return `linear-gradient(135deg, ${stops})`;
  });

  ngOnInit() {
    const profile = this.userProfile();
    this.displayName.set(profile.displayName || '');
    this.preferredStyle.set(profile.preferredStyle || '');
  }

  async saveProfile() {
    try {
      await this.wardrobeService.updateProfile({
        displayName: this.displayName(),
        preferredStyle: this.preferredStyle(),
        season: this.userProfile().season,
        subSeason: this.userProfile().subSeason,
        palette: this.userProfile().palette,
        profilePicture: this.userProfile().profilePicture
      });
      this.isEditing.set(false);
      this.notificationService.success('Profile saved successfully!');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to save profile. Please try again.');
    }
  }

  // Profile picture upload methods
  triggerFileInput() {
    this.fileInput?.nativeElement?.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.notificationService.error('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('Image must be smaller than 5MB.');
      return;
    }

    this.isUploadingPicture.set(true);

    try {
      // Convert to base64
      const base64 = await this.fileToBase64(file);
      
      // Update profile with new picture
      await this.wardrobeService.updateProfile({
        ...this.userProfile(),
        profilePicture: base64
      });
      
      this.notificationService.success('Profile picture updated!');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to upload profile picture.');
    } finally {
      this.isUploadingPicture.set(false);
      // Reset file input
      if (input) input.value = '';
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async removeProfilePicture() {
    try {
      await this.wardrobeService.updateProfile({
        ...this.userProfile(),
        profilePicture: undefined
      });
      this.notificationService.success('Profile picture removed.');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to remove profile picture.');
    }
  }

  // Change password methods
  openChangePasswordModal() {
    this.showChangePasswordModal.set(true);
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal.set(false);
  }

  async changePassword() {
    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.notificationService.error('Please fill in all fields.');
      return;
    }

    if (this.newPassword().length < 6) {
      this.notificationService.error('New password must be at least 6 characters.');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.notificationService.error('New passwords do not match.');
      return;
    }

    this.isChangingPassword.set(true);

    try {
      const response = await this.authService.changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword()
      });

      if (response.success) {
        this.notificationService.success('Password changed successfully!');
        this.closeChangePasswordModal();
      } else {
        this.notificationService.error(response.message || 'Failed to change password.');
      }
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to change password. Please try again.');
    } finally {
      this.isChangingPassword.set(false);
    }
  }
}
