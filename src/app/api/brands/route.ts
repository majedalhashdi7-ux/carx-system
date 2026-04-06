// CAR X API - الوكالات
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Brand, Car } from '@/lib/models';
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
  try {
    await connectDB();

    const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();

    // Count cars per brand
    const brandsWithCount = await Promise.all(
      brands.map(async (brand: any) => {
        const carCount = await Car.countDocuments({
          $or: [
            { make: { $regex: brand.name, $options: 'i' } },
            { make: { $regex: brand.nameEn || brand.name, $options: 'i' } },
          ],
          isActive: true,
        });
        return { ...brand, carCount };
      })
    );

    return NextResponse.json({
      success: true,
      data: brandsWithCount,
    });
  } catch (error: any) {
    console.error('Brands API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = verifyToken(request);
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }
  try {
    await connectDB();
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'اسم الوكالة مطلوب' }, { status: 400 });
    }
    const brand = await Brand.create({ ...body, isActive: true });
    return NextResponse.json({ success: true, data: brand }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
