import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json({ success: false, error: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 });
    }
    await connectDB();
    const target = await User.findById(id);
    if (!target) return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    if (target.role === 'admin') {
      return NextResponse.json({ success: false, error: 'لا يمكن حذف مشرف' }, { status: 403 });
    }
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
