// CAR X API - تفاصيل سيارة واحدة
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Car } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const car = await Car.findOne({ _id: id, isActive: true }).lean();

    if (!car) {
      return NextResponse.json(
        { success: false, error: 'السيارة غير موجودة' },
        { status: 404 }
      );
    }

    // Increment view count
    await Car.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Get related cars (same make)
    const related = await Car.find({
      _id: { $ne: id },
      make: (car as any).make,
      isActive: true,
    })
      .limit(4)
      .lean();

    return NextResponse.json({
      success: true,
      data: car,
      related,
    });
  } catch (error: any) {
    console.error('Car detail API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
