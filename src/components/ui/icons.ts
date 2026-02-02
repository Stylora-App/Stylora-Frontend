import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icons.html',
  styleUrl: './icons.css'
})
export class IconComponent {
  name = input.required<string>();
  class = input<string>('w-6 h-6');
}
