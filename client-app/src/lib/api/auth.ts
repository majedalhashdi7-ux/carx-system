import { fetchAPI } from './index';

export const auth = {
    login: (credentials: object) => fetchAPI('/api/v2/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
    
    clientLogin: (credentials: object) => fetchAPI('/api/v2/auth/client-login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
    
    clientRegister: (data: object) => fetchAPI('/api/v2/auth/client-register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    autoLogin: (data: { name: string; password: string; deviceId?: string }) =>
        fetchAPI('/api/v2/auth/auto-login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    
    sendOtp: (payload: { phone: string }) =>
        fetchAPI('/api/v2/auth/otp/send', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    
    verifyOtp: (payload: { phone: string; code: string }) =>
        fetchAPI('/api/v2/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    
    register: (data: object) => fetchAPI('/api/v2/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    verify: () => fetchAPI('/api/v2/auth/verify'),
    
    logout: () => fetchAPI('/api/v2/auth/logout', {
        method: 'POST',
    }),
    
    changePassword: (data: object) => fetchAPI('/api/v2/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
