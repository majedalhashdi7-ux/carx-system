/**
 * TypeScript Interfaces & Types
 * تعريفات الأنواع لتحسين IntelliSense وتقليل الأخطاء
 */

// ─── Car Types ───
export interface Car {
  id: string;
  _id?: string;
  make: string;
  makeAr?: string;
  model: string;
  modelAr?: string;
  year: number;
  price: number;
  priceSar?: number;
  priceKrw?: number;
  mileage?: number;
  mileageKm?: number;
  images: string[];
  thumbnail?: string;
  condition: 'new' | 'used' | 'certified' | 'excellent' | 'good' | 'fair';
  stockQty?: number;
  stock?: number;
  description?: string;
  descriptionAr?: string;
  features?: string[];
  featuresAr?: string[];
  color?: string;
  colorAr?: string;
  transmission?: 'automatic' | 'manual' | 'cvt';
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  engineSize?: number;
  doors?: number;
  seats?: number;
  vin?: string;
  status?: 'available' | 'sold' | 'reserved' | 'pending';
  location?: string;
  locationAr?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Part Types ───
export interface Part {
  id: string;
  _id?: string;
  name: string;
  nameAr?: string;
  brand?: string;
  brandName?: string;
  brandAr?: string;
  category?: string;
  categoryAr?: string;
  price: number;
  priceSar?: number;
  priceKrw?: number;
  img?: string;
  images?: string[];
  thumbnail?: string;
  stockQty?: number;
  stock?: number;
  condition?: 'new' | 'used' | 'refurbished' | 'oem' | 'aftermarket';
  description?: string;
  descriptionAr?: string;
  partNumber?: string;
  compatibility?: string[];
  compatibilityAr?: string[];
  warranty?: string;
  warrantyAr?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  status?: 'available' | 'out_of_stock' | 'discontinued';
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Auction Types ───
export interface Auction {
  id: string;
  _id?: string;
  carId: string;
  car?: Car;
  startingPrice: number;
  currentBid: number;
  highestBid?: number;
  minimumBid?: number;
  bidIncrement?: number;
  status: 'scheduled' | 'running' | 'live' | 'ended' | 'cancelled' | 'paused';
  startsAt: Date | string;
  endsAt: Date | string;
  bids: Bid[];
  bidCount?: number;
  winnerId?: string;
  winner?: User;
  reservePrice?: number;
  reserveMet?: boolean;
  viewCount?: number;
  watchers?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Bid {
  id: string;
  _id?: string;
  userId: string;
  user?: User;
  auctionId?: string;
  amount: number;
  timestamp: Date | string;
  status?: 'active' | 'outbid' | 'winning' | 'won' | 'lost';
  isAutoBid?: boolean;
  maxAutoBid?: number;
}

// ─── User Types ───
export interface User {
  id: string;
  _id?: string;
  email?: string;
  name: string;
  nameAr?: string;
  role: 'buyer' | 'admin' | 'seller' | 'super_admin' | 'manager';
  phone?: string;
  avatar?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'banned';
  permissions?: string[];
  address?: Address;
  preferences?: UserPreferences;
  lastLoginAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Address {
  street?: string;
  city?: string;
  cityAr?: string;
  state?: string;
  stateAr?: string;
  country?: string;
  countryAr?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface UserPreferences {
  language?: 'ar' | 'en';
  currency?: 'SAR' | 'KRW' | 'USD';
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  theme?: 'dark' | 'light' | 'auto';
}

// ─── Order Types ───
export interface Order {
  id: string;
  _id?: string;
  userId: string;
  user?: User;
  items: OrderItem[];
  total: number;
  totalSar?: number;
  totalKrw?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'card' | 'bank_transfer' | 'cash' | 'wallet';
  shippingAddress?: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  notes?: string;
  notesAr?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  id: string;
  type: 'car' | 'part';
  itemId: string;
  item?: Car | Part;
  quantity: number;
  price: number;
  total: number;
}

export interface CartItem {
  id: string;
  type: 'car' | 'part';
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

// ─── API Response Types ───
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Error Types ───
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}