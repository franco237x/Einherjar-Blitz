/**
 * Store Data Types — Einherjar Blitz Mobile
 *
 * Products live in Firestore collection `products/{productId}`.
 * Purchases are recorded in `users/{uid}/purchases/{purchaseId}`.
 */

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number; // in spheres
  imageUrl: string; // remote URL
  stock: number;
  category: string;
  isExclusive?: boolean; // champions-style golden border
  createdAt?: Date | null;
}

export interface PurchaseRecord {
  id: string;
  productId: string;
  productName: string;
  price: number;
  purchasedAt: Date | null;
}
