// CAR X - إنشاء حساب Admin الأول (يعمل مرة واحدة فقط)
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';

const SETUP_KEY = process.env.SETUP_SECRET_KEY || 'carx-setup-2024';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setupKey, name, email, password } = body;

    // Validate setup key
    if (setupKey !== SETUP_KEY) {
      return NextResponse.json(
        { success: false, error: 'مفتاح الإعداد غير صحيح' },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'يوجد مشرف بالفعل. استخدم صفحة تسجيل الدخول.' },
        { status: 409 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
      role: 'admin',
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حساب المشرف بنجاح! يمكنك الآن تسجيل الدخول.',
      user: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Setup API Error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
