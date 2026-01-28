import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WardrobeService, WardrobeItem } from '../../services/wardrobe.service';
import { GeminiService } from '../../services/gemini.service';
import { IconComponent } from '../ui/icons.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wardrobe',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-serif font-bold text-gray-900">Digital Wardrobe</h2>
          <p class="text-gray-500">Manage your collection</p>
        </div>
        <button (click)="isUploading.set(true)" class="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-lg">
          <app-icon name="plus" class="w-5 h-5"/>
          <span>Add Item</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        @for (cat of categories; track cat) {
          <button 
            (click)="selectedCategory.set(cat)"
            [class.bg-gray-900]="selectedCategory() === cat"
            [class.text-white]="selectedCategory() === cat"
            [class.bg-white]="selectedCategory() !== cat"
            [class.text-gray-600]="selectedCategory() !== cat"
            class="px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium transition whitespace-nowrap">
            {{cat | titlecase}}
          </button>
        }
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (item of filteredItems(); track item.id) {
          <div class="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden aspect-[3/4]">
            <img [src]="item.image" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="Clothing item">
            
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4 text-white">
              <div class="font-medium capitalize">{{item.category}}</div>
              <div class="text-xs opacity-75 mb-2">{{item.tags.join(', ')}}</div>
              <div class="flex gap-2">
                <button (click)="deleteItem(item.id)" class="p-2 bg-white/20 backdrop-blur rounded-full hover:bg-red-500 hover:border-red-500 transition">
                  <app-icon name="trash" class="w-4 h-4"/>
                </button>
                 <div class="ml-auto text-xs flex items-center gap-1 bg-white/20 px-2 rounded-full">
                  <span>Worn: {{item.wearCount}}</span>
                </div>
              </div>
            </div>
            
            @if (item.category === 'top' && item.color) {
               <div class="absolute top-2 right-2 w-4 h-4 rounded-full border border-white shadow-sm" [style.background-color]="item.color"></div>
            }
          </div>
        } @empty {
          <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <app-icon name="hanger" class="w-16 h-16 mb-4 opacity-50"/>
            <p>Your wardrobe is empty.</p>
            <p class="text-sm">Upload your first item to get started.</p>
          </div>
        }
      </div>

      <!-- Upload Modal -->
      @if (isUploading()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button (click)="isUploading.set(false)" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
              <span class="text-2xl">&times;</span>
            </button>
            
            <h3 class="text-xl font-serif font-bold mb-4">Add New Item</h3>
            
            <div class="space-y-4">
              <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-gray-900 transition cursor-pointer relative bg-gray-50">
                <input type="file" accept="image/*" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer">
                @if (newItemImage()) {
                  <img [src]="newItemImage()" class="h-48 object-contain mb-4 rounded shadow-md">
                } @else {
                  <app-icon name="camera" class="w-10 h-10 text-gray-400 mb-2"/>
                  <p class="text-sm text-gray-500">Click to upload photo</p>
                }
              </div>

              @if (newItemImage()) {
                <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select [(ngModel)]="newItemCategory" class="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm">
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="shoes">Shoes</option>
                        <option value="accessory">Accessory</option>
                        <option value="fullbody">Full Body</option>
                      </select>
                   </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Occasion</label>
                      <select [(ngModel)]="newItemOccasion" class="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm">
                        <option value="casual">Casual</option>
                        <option value="office">Office</option>
                        <option value="sport">Sport</option>
                        <option value="date">Date Night</option>
                        <option value="party">Party</option>
                      </select>
                   </div>
                </div>

                <button 
                  (click)="saveNewItem()"
                  [disabled]="isAnalyzing()"
                  class="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 flex justify-center gap-2">
                  @if (isAnalyzing()) {
                    <span class="animate-spin">⟳</span> Analyzing...
                  } @else {
                    <span>Save to Wardrobe</span>
                  }
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class WardrobeComponent {
  wardrobeService = inject(WardrobeService);
  geminiService = inject(GeminiService);

  isUploading = signal(false);
  isAnalyzing = signal(false);
  newItemImage = signal<string | null>(null);
  newItemCategory = 'top';
  newItemOccasion = 'casual';

  categories = ['all', 'top', 'bottom', 'shoes', 'accessory', 'fullbody'];
  selectedCategory = signal('all');

  filteredItems = computed(() => {
    const all = this.wardrobeService.items();
    const cat = this.selectedCategory();
    if (cat === 'all') return all;
    return all.filter(i => i.category === cat);
  });

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.newItemImage.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async saveNewItem() {
    if (!this.newItemImage()) return;
    
    this.isAnalyzing.set(true);
    try {
      // Analyze with Gemini to get description and color
      const desc = await this.geminiService.describeClothing(this.newItemImage()!.split(',')[1]);
      
      this.wardrobeService.addItem({
        image: this.newItemImage()!,
        category: this.newItemCategory as any,
        tags: [this.newItemOccasion],
        description: desc
      });
      
      this.isUploading.set(false);
      this.newItemImage.set(null);
    } catch (e) {
      console.error(e);
      alert('Failed to analyze image. Try again.');
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  deleteItem(id: string) {
    if(confirm('Are you sure you want to remove this item?')) {
      this.wardrobeService.deleteItem(id);
    }
  }
}