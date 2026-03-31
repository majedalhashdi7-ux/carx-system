// CAR X Admin API - CRUD للسيارات
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Car } from '@/lib/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'carx-fallback-secret';

function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('carx-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!['admin', 'manager'].includes(decoded.role)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const query: any = {};
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { make: { $regex: search, $options: 'i' } },
  ];

  const [cars, total] = await Promise.all([
    Car.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Car.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    data: cars,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();

    const car = await Car.create({
      ...body,
      source: body.source || 'korean_import',
      listingType: body.listingType || 'showroom',
      isActive: true,
    });

    return NextResponse.json({ success: true, data: car }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
