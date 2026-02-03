import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})
export class NotificationComponent {
  notificationService = inject(NotificationService);

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'M5 13l4 4L19 7';
      case 'error':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'info':
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-100 text-green-600';
      case 'error':
        return 'bg-red-50 border-red-100 text-red-600';
      case 'warning':
        return 'bg-amber-50 border-amber-100 text-amber-600';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-100 text-blue-600';
    }
  }

  close(id: string) {
    this.notificationService.remove(id);
  }

  onConfirm(id: string, result: boolean) {
    this.notificationService.resolveConfirm(id, result);
  }

  isConfirm(notification: any): boolean {
    return notification.resolve !== undefined;
  }
}
