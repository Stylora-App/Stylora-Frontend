import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { AuthService } from '../../services/auth.service';
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

  isEditing = signal(false);
  displayName = signal('');
  preferredStyle = signal('');

  userProfile = computed(() => this.wardrobeService.userProfile());
  
  // Generate CSS gradient from palette colors for the aura effect
  paletteGradient = computed(() => {
    const palette = this.userProfile().palette || [];
    if (palette.length === 0) return '';
    
    if (palette.length === 1) {
      return `radial-gradient(circle, ${palette[0]}40 0%, ${palette[0]}20 50%, transparent 100%)`;
    }
    
    // Create a smooth gradient from all palette colors
    const stops = palette.map((color, index) => {
      const position = (index / (palette.length - 1)) * 100;
      return `${color}40 ${position}%`;
    }).join(', ');
    
    return `conic-gradient(from 0deg, ${stops})`;
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
      alert('Profile saved!');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile');
    }
  }
}
