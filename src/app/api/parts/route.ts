// CAR X API - قطع الغيار
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SparePart } from '@/lib/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'carx-fallback-secret';

function verifyToken(request: NextRequest) {
  const token = request.cookies.get('carx-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { role: string; id: string };
  } catch {
    return null;
  }
}

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

export async function POST(request: NextRequest) {
  const user = verifyToken(request);
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }
  try {
    await connectDB();
    const body = await request.json();
    if (!body.nameAr && !body.name) {
      return NextResponse.json({ success: false, error: 'اسم القطعة مطلوب' }, { status: 400 });
    }
    const part = await SparePart.create({
      ...body,
      price: body.priceSar || body.price || 0,
      isActive: true,
      inStock: (body.stockQty ?? 1) > 0,
    });
    return NextResponse.json({ success: true, data: part }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
