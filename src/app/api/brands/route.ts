// CAR X API - الوكالات
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Brand, Car } from '@/lib/models';

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
