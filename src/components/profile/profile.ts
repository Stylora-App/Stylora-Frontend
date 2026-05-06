import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';
import { PASSWORD_POLICY_MESSAGE, isPasswordPolicyValid } from '../../utils/password-policy';

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
  firstName = signal('');
  lastName = signal('');
  style = signal('');

  readonly styleOptions = ['Casual', 'Office', 'Sport', 'Elegant', 'Bohemian', 'Streetwear', 'Formal'];

  // Change password modal state
  showChangePasswordModal = signal(false);
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  isChangingPassword = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  readonly passwordPolicyMessage = PASSWORD_POLICY_MESSAGE;

  isUploadingPicture = signal(false);

  get userProfile() {
    return this.wardrobeService.userProfile;
  }

  avatarGradient = computed(() => {
    const palette = this.wardrobeService.userProfile().palette || [];
    if (palette.length === 0) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (palette.length === 1) return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[0]} 100%)`;
    const stops = palette.slice(0, 3).map((color, index, arr) => {
      const position = (index / (arr.length - 1)) * 100;
      return `${color} ${position}%`;
    }).join(', ');
    return `linear-gradient(135deg, ${stops})`;
  });

  paletteAuraGradient = computed(() => {
    const palette = this.wardrobeService.userProfile().palette || [];
    if (palette.length === 0) return null;
    const colors = palette.length === 1 ? [palette[0], palette[0], palette[0]] : palette.slice(0, 6);
    return `conic-gradient(${[...colors, colors[0]].join(', ')})`;
  });

  ngOnInit() {
    const profile = this.userProfile();
    this.firstName.set(profile.firstName || '');
    this.lastName.set(profile.lastName || '');
    this.style.set(profile.style || '');
  }

  startEditing() {
    const profile = this.userProfile();
    this.firstName.set(profile.firstName || '');
    this.lastName.set(profile.lastName || '');
    this.style.set(profile.style || '');
    this.isEditing.set(true);
  }

  async saveProfile() {
    try {
      await this.wardrobeService.updateProfile({
        firstName: this.firstName() || undefined,
        lastName: this.lastName() || undefined,
        style: this.style() || undefined
      });
      this.isEditing.set(false);
      this.notificationService.success('Profile saved successfully!');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to save profile. Please try again.');
    }
  }

  triggerFileInput() {
    this.fileInput?.nativeElement?.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notificationService.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('Image must be smaller than 5MB.');
      return;
    }

    this.isUploadingPicture.set(true);
    try {
      const base64 = await this.fileToBase64(file);
      await this.wardrobeService.updateProfile({ profilePicture: base64 });
      this.notificationService.success('Profile picture updated!');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to upload profile picture.');
    } finally {
      this.isUploadingPicture.set(false);
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
      await this.wardrobeService.updateProfile({ profilePicture: '' });
      this.notificationService.success('Profile picture removed.');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to remove profile picture.');
    }
  }

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
    if (!isPasswordPolicyValid(this.newPassword())) {
      this.notificationService.error(this.passwordPolicyMessage);
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
