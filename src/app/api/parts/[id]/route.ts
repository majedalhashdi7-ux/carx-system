// CAR X API - تفاصيل قطعة غيار
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SparePart } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const part = await SparePart.findOne({ _id: params.id, isActive: true }).lean();

    if (!part) {
      return NextResponse.json(
        { success: false, error: 'القطعة غير موجودة' },
        { status: 404 }
      );
    }

    // Related parts (same carMake)
    const related = await SparePart.find({
      _id: { $ne: params.id },
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
