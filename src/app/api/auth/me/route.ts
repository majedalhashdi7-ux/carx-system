import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const JWT_SECRET = process.env.NEXTAUTH_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }

    const token = request.cookies.get('carx-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    await connectDB();
    const user = await User.findById(decoded.id).select('-password -loginAttempts -lockUntil');

    if (!user || user.status !== 'active' || user.tokenVersion !== decoded.version) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
      },
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
  }
}
