import { NextRequest, NextResponse } from 'next/server';
import { backendApiUrl, SERVER_TENANT } from '@/lib/serverApi';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (Number(request.headers.get('content-length') || 0) > 16 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 413 });
  try {
    const base = backendApiUrl(request.nextUrl.origin);
    const headers = { authorization, 'X-Tenant-ID': SERVER_TENANT };
    const identity = await fetch(`${base}/auth/me`, { headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!identity.ok) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    const payload = await identity.json();
    const user = payload.data?.user || payload.user;
    if (!['admin', 'super_admin'].includes(user?.role) && !user?.permissions?.some((permission: string) => ['manage_cars', 'manage_parts', 'manage_brands', 'manage_settings'].includes(permission))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // The backend enforces rate/size limits and re-encodes the image bytes.
    const upstream = await fetch(`${base}/upload`, {
      method: 'POST', headers: { ...headers, 'content-type': request.headers.get('content-type') || '' },
      body: request.body, duplex: 'half', redirect: 'error', signal: AbortSignal.timeout(25000),
    } as RequestInit & { duplex: 'half' });
    return new NextResponse(upstream.body, { status: upstream.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Upload service unavailable' }, { status: 502 });
  }
}
