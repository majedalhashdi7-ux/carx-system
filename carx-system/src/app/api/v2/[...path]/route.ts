import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://hmcar-system-two.vercel.app';

/**
 * CarX API Proxy Route
 * يُعيد توجيه جميع طلبات /api/v2/* إلى الـ backend المشترك
 * مع تمرير X-Tenant-ID: carx تلقائياً في كل طلب
 */
async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path?.join('/') || '';
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/api/v2/${path}${url.search}`;

  // نسخ headers الأصلية مع إضافة/override الـ tenant
  const headers = new Headers(req.headers);
  headers.set('X-Tenant-ID', 'carx');
  headers.set('X-Forwarded-For', req.headers.get('x-forwarded-for') || '');
  // إزالة headers التي قد تسبب مشاكل
  headers.delete('host');

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

    // نسخ الـ response مع headers CORS
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
  } catch (error: any) {
    console.error('[CarX Proxy] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Backend proxy error', message: error.message },
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
