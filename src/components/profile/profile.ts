import { Component, inject, signal, computed } from '@angular/core';
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

  isEditing = signal(false);
  displayName = signal('');
  preferredStyle = signal('');

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
        palette: this.userProfile().palette
      });
      this.isEditing.set(false);
      this.notificationService.success('Profile saved successfully!');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to save profile. Please try again.');
    }
  }
}
