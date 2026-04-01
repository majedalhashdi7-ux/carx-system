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

// ─── Invoice Types ───
export interface Invoice {
  id: string;
  _id?: string;
  orderId: string;
  order?: Order;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate?: Date | string;
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  discountRate?: number;
  shipping?: number;
  total: number;
  currency: 'SAR' | 'KRW' | 'USD';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: Date | string;
  notes?: string;
  notesAr?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Brand Types ───
export interface Brand {
  id: string;
  _id?: string;
  name: string;
  nameAr?: string;
  logo?: string;
  description?: string;
  descriptionAr?: string;
  country?: string;
  countryAr?: string;
  website?: string;
  carCount?: number;
  partCount?: number;
  featured?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ─── Notification Types ───
export interface Notification {
  id: string;
  _id?: string;
  userId: string;
  type: 'auction' | 'order' | 'payment' | 'system' | 'message' | 'bid';
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  read: boolean;
  link?: string;
  data?: any;
  createdAt: Date | string;
}

// ─── Message Types ───
export interface Message {
  id: string;
  _id?: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  subject?: string;
  subjectAr?: string;
  content: string;
  contentAr?: string;
  read: boolean;
  readAt?: Date | string;
  attachments?: string[];
  createdAt: Date | string;
}

// ─── Review Types ───
export interface Review {
  id: string;
  _id?: string;
  userId: string;
  user?: User;
  itemId: string;
  itemType: 'car' | 'part' | 'seller';
  rating: number; // 1-5
  comment?: string;
  commentAr?: string;
  verified?: boolean;
  helpful?: number;
  notHelpful?: number;
  response?: string;
  responseAr?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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

// ─── Filter & Search Types ───
export interface CarFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  condition?: string[];
  transmission?: string[];
  fuelType?: string[];
  color?: string[];
  status?: string[];
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc' | 'mileage_asc' | 'mileage_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface PartFilters {
  brand?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: string[];
  status?: string[];
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

// ─── Form Types ───
export interface LoginForm {
  identifier: string; // email, phone, or name
  password: string;
  role?: 'buyer' | 'admin';
  rememberMe?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
}

export interface BidForm {
  auctionId: string;
  amount: number;
  maxAutoBid?: number;
}

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// ─── Stats & Analytics Types ───
export interface DashboardStats {
  totalCars: number;
  totalParts: number;
  totalOrders: number;
  totalRevenue: number;
  activeAuctions: number;
  totalUsers: number;
  recentOrders: Order[];
  topCars: Car[];
  topParts: Part[];
}

export interface AnalyticsData {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  period: 'day' | 'week' | 'month' | 'year';
  data: {
    date: string;
    value: number;
  }[];
}

// ─── Socket Event Types ───
export interface SocketBidEvent {
  auctionId: string;
  bid: Bid;
  currentBid: number;
  bidCount: number;
}

export interface SocketAuctionEvent {
  auctionId: string;
  status: Auction['status'];
  message?: string;
}

// ─── Utility Types ───
export type Language = 'ar' | 'en';
export type Currency = 'SAR' | 'KRW' | 'USD';
export type Theme = 'dark' | 'light' | 'auto';

export interface LocalizedString {
  ar: string;
  en: string;
}

// ─── Component Props Types ───
export interface CarCardProps {
  car: Car;
  index?: number;
  onClick?: () => void;
  onFavorite?: () => void;
  showActions?: boolean;
}

export interface PartCardProps {
  part: Part;
  index?: number;
  onClick?: () => void;
  onLoginRequired?: () => void;
  showActions?: boolean;
}

export interface AuctionCardProps {
  auction: Auction;
  onBid?: (amount: number) => void;
  showTimer?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// ─── Error Types ───
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}
