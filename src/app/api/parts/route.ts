// CAR X API - قطع الغيار
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SparePart } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const carMake = searchParams.get('carMake') || '';
    const partType = searchParams.get('partType') || '';
    const condition = searchParams.get('condition') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: Record<string, any> = { isActive: true, inStock: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (carMake) query.carMake = { $regex: carMake, $options: 'i' };
    if (partType) query.partType = { $regex: partType, $options: 'i' };
    if (condition) query.condition = condition;

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, any> = { [sortBy]: sortDirection };

    const [parts, total] = await Promise.all([
      SparePart.find(query).sort(sort).skip(skip).limit(limit).lean(),
      SparePart.countDocuments(query),
    ]);

    // Get unique categories for filter
    const categories = await SparePart.distinct('partType', { isActive: true, inStock: true });
    const carMakes = await SparePart.distinct('carMake', { isActive: true, inStock: true });

    return NextResponse.json({
      success: true,
      data: parts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        categories: categories.filter(Boolean),
        carMakes: carMakes.filter(Boolean),
      },
    });
  } catch (error: any) {
    console.error('Parts API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
