// CAR X API - تسجيل الخروج
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('carx-token')?.value;
    
    if (token && JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();
        // Invalidate all existing tokens for this user
        await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
      } catch {
        // Invalid token, just clear cookie
      }
    }

    const response = NextResponse.json({ success: true });
    
    // Clear the auth cookie
    response.cookies.delete('carx-token');

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
