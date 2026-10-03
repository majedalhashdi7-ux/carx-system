import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://hmcar-system-two.vercel.app';

/**
 * CarX API Proxy Route
 * يُعيد توجيه جميع طلبات /api/v2/* إلى الـ backend المشترك
 * مع تمرير X-Tenant-ID: carx تلقائياً في كل طلب
 * متوافق مع Next.js 15 (params كـ Promise)
 */
type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, context: RouteContext) {
  const { path: pathSegments } = await context.params;
  const path = pathSegments?.join('/') || '';
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/api/v2/${path}${url.search}`;

  const headers = new Headers();
  headers.set('Content-Type', req.headers.get('content-type') || 'application/json');
  headers.set('X-Tenant-ID', 'carx');
  const auth = req.headers.get('authorization');
  if (auth) headers.set('Authorization', auth);

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'follow',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID');

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CarX Proxy] Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Backend proxy error', message: msg },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID',
    },
  });
};
