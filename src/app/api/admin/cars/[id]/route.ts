// CAR X Admin API - تعديل/حذف سيارة واحدة
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  await connectDB();
  const car = await Car.findById(params.id).lean();
  if (!car) return NextResponse.json({ success: false, error: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true, data: car });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const car = await Car.findByIdAndUpdate(params.id, body, { new: true });
    if (!car) return NextResponse.json({ success: false, error: 'غير موجود' }, { status: 404 });
    return NextResponse.json({ success: true, data: car });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  await connectDB();
  const car = await Car.findByIdAndDelete(params.id);
  if (!car) return NextResponse.json({ success: false, error: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' });
}
