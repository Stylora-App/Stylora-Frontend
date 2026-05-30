import { Injectable, signal } from '@angular/core';
import type { ShoppingProductDto } from '@/openapi_generated/models/shopping-product-dto';

@Injectable({ providedIn: 'root' })
export class TryOnStateService {
  /** Product set by the Explore page when the user clicks "Try On". */
  pendingProduct = signal<ShoppingProductDto | null>(null);
}
