import { fetchAPI } from './index';

export const parts = {
    list: async (params: Record<string, string | number | boolean> = {}) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        const res: any = await fetchAPI(`/api/v2/parts?${query}`);
        if (res && (res.success || Array.isArray(res.data) || res.data)) {
            const list = Array.isArray(res.data) ? res.data : (res.data?.parts || res.parts || []);
            if (Array.isArray(res.data)) {
                res.data.parts = list;
            } else if (!res.data) {
                res.data = list;
                res.data.parts = list;
            }
            if (!res.parts) res.parts = list;
        }
        return res;
    },
    
    create: (data: Record<string, unknown>) => fetchAPI('/api/v2/parts', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/parts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    
    delete: (id: string) => fetchAPI(`/api/v2/parts/${id}`, {
        method: 'DELETE',
    }),
    
    scrape: () => fetchAPI('/api/v2/parts/scrape/brands', {
        method: 'POST'
    }),
    
    toggleStock: (id: string) => fetchAPI(`/api/v2/parts/${id}/toggle-stock`, {
        method: 'PATCH'
    }),
};
