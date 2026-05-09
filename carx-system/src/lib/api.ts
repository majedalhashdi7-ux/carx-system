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
        headers['Authorization'] = `Bearer ${token}`;
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
  },
  brands: {
    getAll: () => fetchAPI('/brands'),
  },
  // Add more services as needed (auth, etc)
};
