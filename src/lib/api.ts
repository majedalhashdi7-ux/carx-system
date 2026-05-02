// API utilities for CAR X System

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Cars
  async getCars(params?: {
    page?: number;
    limit?: number;
    search?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/cars${queryString ? `?${queryString}` : ''}`);
  }

  async getCar(id: string) {
    return this.request(`/cars/${id}`);
  }

  // Parts
  async getParts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
  }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/parts${queryString ? `?${queryString}` : ''}`);
  }

  async getPart(id: string) {
    return this.request(`/parts/${id}`);
  }

  // Brands
  async getBrands() {
    return this.request('/brands');
  }

  async getBrand(id: string) {
    return this.request(`/brands/${id}`);
  }

  // Orders
  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  // Contact
  async sendContactMessage(messageData: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }
}

// Create and export API instance
export const api = new ApiClient();

// Mock data for development
export const mockData = {
  cars: [
    {
      id: '1',
      title: 'BMW X5 2023',
      make: 'BMW',
      model: 'X5',
      year: 2023,
      price: 250000,
      images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
      mileage: 15000,
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      source: 'korean_import',
      isInspected: true,
      condition: 'Excellent'
    },
    {
      id: '2',
      title: 'Mercedes C-Class 2022',
      make: 'Mercedes',
      model: 'C-Class',
      year: 2022,
      price: 180000,
      images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
      mileage: 25000,
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      isInspected: true,
      condition: 'Very Good'
    }
  ],
  parts: [
    {
      id: '1',
      name: 'BMW Engine Oil Filter',
      nameAr: 'فلتر زيت المحرك BMW',
      price: 150,
      images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400'],
      brand: 'BMW',
      category: 'Engine Parts',
      categoryAr: 'قطع المحرك',
      stock: 25,
      condition: 'New'
    },
    {
      id: '2',
      name: 'Mercedes Brake Pads',
      nameAr: 'فحمات الفرامل مرسيدس',
      price: 300,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
      brand: 'Mercedes',
      category: 'Brake System',
      categoryAr: 'نظام الفرامل',
      stock: 15,
      condition: 'New'
    }
  ],
  brands: [
    {
      id: '1',
      key: 'bmw',
      name: 'BMW',
      nameAr: 'بي إم دبليو',
      logo: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=200',
      description: 'German luxury car manufacturer',
      descriptionAr: 'شركة سيارات ألمانية فاخرة',
      carCount: 45,
      isActive: true
    },
    {
      id: '2',
      key: 'mercedes',
      name: 'Mercedes-Benz',
      nameAr: 'مرسيدس بنز',
      logo: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200',
      description: 'German luxury automotive brand',
      descriptionAr: 'علامة تجارية ألمانية للسيارات الفاخرة',
      carCount: 38,
      isActive: true
    }
  ]
};

// Helper functions
export const formatPrice = (price: number, currency: string = 'SAR'): string => {
  const formatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(price);
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  // Mock conversion rates
  const rates: { [key: string]: number } = {
    SAR: 1,
    USD: 0.27,
    KRW: 350,
  };
  
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to SAR first, then to target currency
  const sarAmount = fromCurrency === 'SAR' ? amount : amount / rates[fromCurrency];
  return toCurrency === 'SAR' ? sarAmount : sarAmount * rates[toCurrency];
};