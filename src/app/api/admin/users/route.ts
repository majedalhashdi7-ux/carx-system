import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'carx-fallback-secret';

function verifyToken(request: NextRequest) {
  const token = request.cookies.get('carx-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { role: string; id: string };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = verifyToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }
  try {
    await connectDB();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
