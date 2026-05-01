// CAR X API - تفاصيل قطعة غيار
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SparePart } from '@/lib/models';
import jwt from 'jsonwebtoken';

function verifyToken(request: NextRequest) {
  const JWT_SECRET = process.env.NEXTAUTH_SECRET;
  if (!JWT_SECRET) {
    console.error('❌ NEXTAUTH_SECRET مطلوب في متغيرات البيئة');
    return null;
  }
  const token = request.cookies.get('carx-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { role: string; id: string };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const part = await SparePart.findOne({ _id: id, isActive: true }).lean();

    if (!part) {
      return NextResponse.json(
        { success: false, error: 'القطعة غير موجودة' },
        { status: 404 }
      );
    }

    // Related parts (same carMake)
    const related = await SparePart.find({
      _id: { $ne: id },
      carMake: (part as any).carMake,
      isActive: true,
      inStock: true,
    })
      .limit(4)
      .lean();

    return NextResponse.json({
      success: true,
      data: part,
      related,
    });
  } catch (error: any) {
    console.error('Part detail API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const part = await SparePart.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!part) return NextResponse.json({ success: false, error: 'غير موجود' }, { status: 404 });
    return NextResponse.json({ success: true, data: part });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    await SparePart.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
