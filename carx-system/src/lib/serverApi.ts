// Server-only destination; never read the backend URL or tenant from request input.
export function backendApiUrl(origin: string) {
  const configured = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || origin;
  const base = configured.replace(/\/api(?:\/v2)?\/?$/, '').replace(/\/$/, '');
  const url = new URL(base);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.hostname === 'localhost')) throw new Error('Backend must use HTTPS');
  return `${base}/api/v2`;
}
export const SERVER_TENANT = 'carx';

export async function verifiedSession(origin: string, token?: string) {
  if (!token) return null;
  try {
    const response = await fetch(backendApiUrl(origin) + '/auth/me', { headers: { authorization: 'Bearer ' + token, 'X-Tenant-ID': SERVER_TENANT }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const payload = await response.json();
    const user = payload.data?.user || payload.user;
    return user?.tenantId === SERVER_TENANT ? user : null;
  } catch { return null; }
}
