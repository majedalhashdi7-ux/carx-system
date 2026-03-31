// CAR X API - تسجيل الخروج
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('carx-token');
  return response;
}
