// CAR X API - سيارات المعرض
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Car } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const make = searchParams.get('make') || '';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const minYear = searchParams.get('minYear') ? parseInt(searchParams.get('minYear')!) : null;
    const maxYear = searchParams.get('maxYear') ? parseInt(searchParams.get('maxYear')!) : null;
    const fuelType = searchParams.get('fuelType') || '';
    const transmission = searchParams.get('transmission') || '';
    const condition = searchParams.get('condition') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: Record<string, any> = { isActive: true };

    // Full-text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (make) query.make = { $regex: make, $options: 'i' };
    if (fuelType) query.fuelType = { $regex: fuelType, $options: 'i' };
    if (transmission) query.transmission = { $regex: transmission, $options: 'i' };
    if (condition) query.condition = condition;

    // Price range
    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = minPrice;
      if (maxPrice !== null) query.price.$lte = maxPrice;
    }

    // Year range
    if (minYear !== null || maxYear !== null) {
      query.year = {};
      if (minYear !== null) query.year.$gte = minYear;
      if (maxYear !== null) query.year.$lte = maxYear;
    }

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, any> = { [sortBy]: sortDirection };

    const [cars, total] = await Promise.all([
      Car.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Car.countDocuments(query),
    ]);

    // Get unique makes for filter
    const makes = await Car.distinct('make', { isActive: true });

    return NextResponse.json({
      success: true,
      data: cars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: { makes: makes.filter(Boolean) },
    });
  } catch (error: any) {
    console.error('Cars API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
