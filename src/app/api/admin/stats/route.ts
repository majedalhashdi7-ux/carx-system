// CAR X API - إحصائيات لوحة الإدارة
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Car, Brand, SparePart, User } from '@/lib/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'carx-fallback-secret';

function verifyToken(request: NextRequest) {
  const token = request.cookies.get('carx-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = verifyToken(request);
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    await connectDB();

    const [totalCars, activeCars, soldCars, totalParts, totalBrands, totalUsers] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ isActive: true, isSold: false }),
      Car.countDocuments({ isSold: true }),
      SparePart.countDocuments({ isActive: true }),
      Brand.countDocuments({ isActive: true }),
      User.countDocuments(),
    ]);

    // Recent cars
    const recentCars = await Car.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      stats: {
        totalCars,
        activeCars,
        soldCars,
        totalParts,
        totalBrands,
        totalUsers,
      },
      recentCars,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
