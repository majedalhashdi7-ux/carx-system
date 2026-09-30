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
    const response = await fetch(
      backendApiUrl(origin) + '/auth/me',
      {
        headers: {
          authorization: 'Bearer ' + token,
          'X-Tenant-ID': SERVER_TENANT,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    // [[FIX]] قبول المستخدم إذا كان tenantId من DB أو من JWT مطابق لـ carx
    const user = payload.data?.user || payload.user;
    if (!user) return null;
    const userTenant = user.tenantId || user.tenant;
    // قبول: tenantId = 'carx' أو لا يوجد tenantId (ادمن عام)
    const isCarxUser = !userTenant || userTenant === SERVER_TENANT;
    return isCarxUser ? user : null;
  } catch {
    // في حالة انتهاء مهلة الشبكة — اعتبر المستخدم غير موثق بدل crash
    return null;
  }
}
