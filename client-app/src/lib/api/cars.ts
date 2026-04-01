import { fetchAPI } from './index';

export const cars = {
    list: (params: Record<string, string | number | boolean> = {}) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchAPI(`/api/v2/cars?${query}`);
    },
    
    getById: (id: string) => fetchAPI(`/api/v2/cars/${id}`),
    
    create: (data: Record<string, unknown>) => fetchAPI('/api/v2/cars', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/cars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (id: string) => fetchAPI(`/api/v2/cars/${id}`, {
        method: 'DELETE'
    }),
    
    getStyles: () => fetchAPI('/api/v2/cars/makes'),
    
    markSold: (id: string, soldPrice?: number) => fetchAPI(`/api/v2/cars/${id}/sold`, {
        method: 'PATCH',
        body: JSON.stringify({ soldPrice }),
    }),
};
