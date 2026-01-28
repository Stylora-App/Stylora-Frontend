import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { IconComponent } from '../ui/icons.component';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div class="text-center space-y-4">
        <h2 class="text-4xl font-serif font-bold text-gray-900">Find Your True Colors</h2>
        <p class="text-lg text-gray-600 max-w-xl mx-auto">
          Upload a selfie to discover your Armochromia season. Stylora uses AI to analyze your skin tone, eyes, and hair to recommend your perfect palette.
        </p>
      </div>

      @if (!analysisResult()) {
        <div class="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-gray-100">
           <div class="relative w-full max-w-sm mx-auto aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-900 transition flex flex-col items-center justify-center cursor-pointer mb-8">
              <input type="file" accept="image/*" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer z-10">
              @if (previewImage()) {
                <img [src]="previewImage()" class="w-full h-full object-cover">
              } @else {
                <div class="p-4 bg-gray-100 rounded-full mb-4">
                  <app-icon name="camera" class="w-8 h-8 text-gray-600"/>
                </div>
                <p class="font-medium text-gray-900">Upload a Selfie</p>
                <p class="text-sm text-gray-500 mt-2">Natural lighting works best</p>
              }
           </div>

           @if (previewImage()) {
             <button 
              (click)="analyze()"
              [disabled]="isLoading()"
              class="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center gap-2 mx-auto">
              @if (isLoading()) {
                <span class="animate-spin">⟳</span> Analyzing your features...
              } @else {
                <app-icon name="sparkles" class="w-5 h-5"/>
                <span>Analyze My Season</span>
              }
             </button>
           }
        </div>
      } @else {
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-slide-up">
           <div class="bg-gray-900 text-white p-8 md:p-12 text-center relative overflow-hidden">
              <div class="relative z-10">
                <div class="uppercase tracking-widest text-sm font-medium mb-2 opacity-80">Your Season Is</div>
                <h3 class="text-5xl md:text-6xl font-serif font-bold mb-4">{{analysisResult().season}}</h3>
                <div class="inline-block px-4 py-1 bg-white/20 rounded-full backdrop-blur-md text-sm">{{analysisResult().subSeason}}</div>
              </div>
              <div class="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50 mix-blend-overlay"></div>
           </div>

           <div class="p-8 md:p-12 space-y-8">
              <div>
                <h4 class="text-xl font-bold mb-4 font-serif">About Your Palette</h4>
                <p class="text-gray-600 leading-relaxed">{{analysisResult().description}}</p>
              </div>

              <div>
                <h4 class="text-xl font-bold mb-4 font-serif">Recommended Colors</h4>
                <div class="flex flex-wrap gap-4">
                  @for (color of analysisResult().recommendedColors; track color) {
                    <div class="flex flex-col items-center gap-2">
                      <div class="w-16 h-16 rounded-full shadow-inner ring-1 ring-gray-100" [style.background-color]="color"></div>
                      <span class="text-xs text-gray-400 font-mono">{{color}}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="bg-gray-50 rounded-xl p-6 flex items-start gap-4">
                 <div class="p-3 bg-white rounded-full shadow-sm">
                   <app-icon name="check" class="w-5 h-5 text-gray-900"/>
                 </div>
                 <div>
                   <h5 class="font-bold text-gray-900 mb-1">Best Metals</h5>
                   <p class="text-gray-600 text-sm">{{analysisResult().bestMetals}}</p>
                 </div>
              </div>

              <div class="flex justify-center pt-4">
                <button (click)="saveProfile()" class="text-gray-900 font-medium hover:underline">
                  Save to Profile & Continue
                </button>
              </div>
           </div>
        </div>
      }
    </div>
  `
})
export class AnalysisComponent {
  geminiService = inject(GeminiService);
  wardrobeService = inject(WardrobeService);

  previewImage = signal<string | null>(null);
  isLoading = signal(false);
  analysisResult = signal<any>(null);

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.previewImage.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async analyze() {
    if (!this.previewImage()) return;
    this.isLoading.set(true);
    try {
      const result = await this.geminiService.analyzeSeason(this.previewImage()!.split(',')[1]);
      this.analysisResult.set(result);
    } catch (e) {
      console.error(e);
      alert('Analysis failed. Please try a different photo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  saveProfile() {
    if (this.analysisResult()) {
      this.wardrobeService.updateProfile({
        season: this.analysisResult().season,
        subSeason: this.analysisResult().subSeason,
        palette: this.analysisResult().recommendedColors
      });
      alert('Profile updated!');
    }
  }
}