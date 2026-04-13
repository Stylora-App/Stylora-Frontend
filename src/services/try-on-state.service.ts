import { Injectable, signal } from '@angular/core';
import { IShoppingProduct } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TryOnStateService {
  /** Product set by the Explore page when the user clicks "Try On". */
  pendingProduct = signal<IShoppingProduct | null>(null);
}
