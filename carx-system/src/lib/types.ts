// CAR X TypeScript Strict Types Definitions

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'super_admin' | 'user';
  createdAt?: string;
}

export interface Car {
  _id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  category: 'sports' | 'luxury' | 'suv' | 'classic' | 'electric';
  images: string[];
  specs: {
    engine?: string;
    transmission?: 'automatic' | 'manual';
    fuelType?: 'petrol' | 'diesel' | 'hybrid' | 'electric';
    mileage?: number;
    color?: string;
    horsePower?: number;
  };
  features?: string[];
  status: 'available' | 'reserved' | 'sold';
  createdAt?: string;
}

export interface OrderItem {
  carId?: string;
  partId?: string;
  titleSnapshot: string;
  priceSnapshot: number;
  unitPriceSar: number;
  unitPriceUsd?: number;
  quantity: number;
  typeSnapshot: 'car' | 'spare_part';
}

export interface OrderPricing {
  subTotalSar: number;
  subTotalUsd?: number;
  shippingSar: number;
  shippingUsd?: number;
  grandTotalSar: number;
  grandTotalUsd?: number;
  exchangeSnapshot?: {
    usdToSar: number;
    usdToKrw: number;
    activeCurrency: string;
    capturedAt: string;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  buyer: User;
  items: OrderItem[];
  pricing: OrderPricing;
  notes?: string;
  channel: 'whatsapp' | 'web';
  status: 'pending' | 'approved' | 'cancelled';
  createdAt: string;
}

export interface SiteSettings {
  siteInfo: {
    name: string;
    description: string;
    logo?: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    whatsapp?: string;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  currencySettings: {
    usdToSar: number;
    usdToKrw: number;
    activeCurrency: 'SAR' | 'USD' | 'KRW';
  };
}
