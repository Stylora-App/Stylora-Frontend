import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private notificationCounter = 0;

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 5000) {
    const id = `notification-${++this.notificationCounter}-${Date.now()}`;
    const notification: Notification = { id, type, message, duration };
    
    this.notifications.update(notifications => [...notifications, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  remove(id: string) {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  clear() {
    this.notifications.set([]);
  }

  async confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const id = `confirm-${++this.notificationCounter}-${Date.now()}`;
      const notification: Notification = { 
        id, 
        type: 'warning', 
        message, 
        duration: 0 
      };
      
      // Store resolve function for later use
      (notification as any).resolve = resolve;
      
      this.notifications.update(notifications => [...notifications, notification]);
    });
  }

  resolveConfirm(id: string, result: boolean) {
    const notification = this.notifications().find(n => n.id === id);
    if (notification && (notification as any).resolve) {
      (notification as any).resolve(result);
      this.remove(id);
    }
  }
}
