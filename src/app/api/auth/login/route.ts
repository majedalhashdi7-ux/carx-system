// CAR X API - تسجيل الدخول الآمن
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Login attempts rate limiting
const loginAttempts = new Map<string, { count: number, timestamp: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_TIME = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const JWT_SECRET = process.env.NEXTAUTH_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Rate limiting for login
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const attempt = loginAttempts.get(ip);

    if (attempt) {
      if (now - attempt.timestamp > LOGIN_BLOCK_TIME) {
        loginAttempts.delete(ip);
      } else if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
        const remainingTime = Math.ceil((LOGIN_BLOCK_TIME - (now - attempt.timestamp)) / 60000);
        return NextResponse.json(
          { success: false, error: `تم حظر المحاولات لمدة ${remainingTime} دقيقة` },
          { status: 429 }
        );
      }
    }

    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'الحساب موقوف. تواصل مع الإدارة' },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password || '');

    if (!isMatch) {
      // Increment login attempts
      await User.findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 } });
      
      // Update IP rate limit
      const currentAttempt = loginAttempts.get(ip);
      if (currentAttempt) {
        currentAttempt.count++;
      } else {
        loginAttempts.set(ip, { count: 1, timestamp: now });
      }

      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Reset login attempts on success
    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      lastLoginAt: new Date(),
    });

    // Generate JWT token with iat and user version
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        version: user.tokenVersion || 0,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
      },
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set('carx-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
