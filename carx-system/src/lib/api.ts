// CAR X API Client
// Handles communication with the main backend and sets the correct tenant ID

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v2';
const TENANT_ID = 'carx'; // Identifies this frontend as the CAR X tenant

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<{ data?: T; error?: string }> {
  try {
    let url = `${API_BASE_URL}${endpoint}`;
    
    // Add query parameters if any
    if (options.params) {
      const urlObj = new URL(url);
      Object.keys(options.params).forEach(key => urlObj.searchParams.append(key, options.params![key]));
      url = urlObj.toString();
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': TENANT_ID, // CRITICAL: Tells the backend to use CAR X's database
      ...(options.headers || {}),
    };

    // If we have a token in localStorage (for client-side calls)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('carx_token');
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, { ...options, headers });
    
    // Handle text response or JSON
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return { error: data.message || data.error || 'حدث خطأ في الاتصال بالخادم' };
    }

    return { data };
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    return { error: error.message || 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.' };
  }
}

export const api = {
  cars: {
    getAll: (params?: Record<string, string>) => fetchAPI('/cars', { params }),
    getById: (id: string) => fetchAPI(`/cars/${id}`),
    getFeatured: () => fetchAPI('/cars?isFeatured=true&limit=6'),
    search: (query: string) => fetchAPI(`/cars?search=${encodeURIComponent(query)}`),
    delete: (id: string) => fetchAPI(`/cars/${id}`, { method: 'DELETE' }),
    update: (id: string, data: any) => fetchAPI(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  },
  parts: {
    getAll: (params?: Record<string, string>) => fetchAPI('/parts', { params }),
    getById: (id: string) => fetchAPI(`/parts/${id}`),
    getByCategory: (category: string) => fetchAPI(`/parts?category=${encodeURIComponent(category)}`),
    create: (data: any) => fetchAPI('/parts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => fetchAPI(`/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchAPI(`/parts/${id}`, { method: 'DELETE' }),
  },
  brands: {
    getAll: () => fetchAPI('/brands'),
    getById: (id: string) => fetchAPI(`/brands/${id}`),
    create: (data: any) => fetchAPI('/brands', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => fetchAPI(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchAPI(`/brands/${id}`, { method: 'DELETE' }),
  },
  contact: {
    send: (data: { name: string; email: string; phone?: string; subject?: string; message: string }) => fetchAPI('/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },
  auth: {
    login: (identifier: string, password: string) => fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role: 'admin' }),
    }),
    register: (data: any) => fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    verify: () => fetchAPI('/auth/verify', { method: 'GET' }),
  },
  admin: {
    getStats: () => fetchAPI('/dashboard/admin'),
  },
  users: {
    getAll: () => fetchAPI('/users'),
  },
  orders: {
    getAll: () => fetchAPI('/orders'),
    getById: (id: string) => fetchAPI(`/orders/${id}`),
    updateStatus: (id: string, status: string) => fetchAPI(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    create: (data: any) => fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },
  settings: {
    get: () => fetchAPI('/settings'),
    getPublic: () => fetchAPI('/settings/public'),
    updateSiteInfo: (siteInfo: any) => fetchAPI('/settings/site-info', {
      method: 'PUT',
      body: JSON.stringify({ siteInfo })
    }),
    updateContactInfo: (contactInfo: any) => fetchAPI('/settings/contact-info', {
      method: 'PUT',
      body: JSON.stringify({ contactInfo })
    }),
    updateCarX: (carxSettings: any) => fetchAPI('/settings/carx', {
      method: 'PUT',
      body: JSON.stringify({ carxSettings })
    })
  }
};
