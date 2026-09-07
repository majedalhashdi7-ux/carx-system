import { fetchAPI } from './index';

export const cars = {
    list: async (params: Record<string, string | number | boolean> = {}) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        const res: any = await fetchAPI(`/api/v2/cars?${query}`);
        if (res && (res.success || Array.isArray(res.data) || res.data)) {
            const list = Array.isArray(res.data) ? res.data : (res.data?.cars || res.cars || []);
            if (Array.isArray(res.data)) {
                res.data.cars = list;
            } else if (!res.data) {
                res.data = list;
                res.data.cars = list;
            }
            if (!res.cars) res.cars = list;
        }
        return res;
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
