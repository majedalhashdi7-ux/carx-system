/**
 * Dynamic Sitemap Generator
 * توليد خريطة الموقع ديناميكياً من قاعدة البيانات
 * 
 * ملاحظة: يستخدم NODE_TLS_REJECT_UNAUTHORIZED=0 فقط أثناء الـ build
 * لتجنب أخطاء شهادات SSL المنتهية في البيئات الداخلية
 */

import { MetadataRoute } from 'next';

const BASE_URL = 'https://hmcar.okigo.net';

// API URL داخلي نسبي للـ build (Vercel يعيد توجيهه عبر vercel.json)
function getApiBase() {
  // في بيئة Vercel Production: نستخدم الـ URL الكامل للموقع
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // في بيئة التطوير المحلي
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:4001';
}

// Helper function to fetch from API with SSL tolerance
async function fetchAPI(endpoint: string): Promise<any> {
  try {
    const apiBase = getApiBase();
    const url = `${apiBase}${endpoint}`;
    
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      // تجاهل أخطاء SSL فقط أثناء بناء الـ sitemap
      ...(process.env.NODE_ENV === 'production' && {
        headers: { 'x-sitemap-request': '1' }
      })
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    // Silently skip — sitemap works without dynamic URLs too
    console.warn(`Sitemap fetch skipped for ${endpoint}:`, (error as Error).message);
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages — هذه دائماً موجودة بغض النظر عن الـ API
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/cars`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/parts`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/auctions`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/showroom`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Fetch dynamic data — فشلها لا يوقف البناء
  const [carsData, partsData, auctionsData, brandsData] = await Promise.all([
    fetchAPI('/api/v2/cars?limit=500&isActive=true'),
    fetchAPI('/api/v2/parts?limit=500&inStock=true'),
    fetchAPI('/api/v2/auctions?status=running&limit=100'),
    fetchAPI('/api/v2/brands?limit=100'),
  ]);

  const cars = carsData?.data?.cars || [];
  const parts = partsData?.data?.parts || [];
  const auctions = auctionsData?.data?.auctions || [];
  const brands = brandsData?.data?.brands || [];

  const carUrls: MetadataRoute.Sitemap = cars.map((car: any) => ({
    url: `${BASE_URL}/cars/${car._id || car.id}`,
    lastModified: car.updatedAt ? new Date(car.updatedAt) : now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const partUrls: MetadataRoute.Sitemap = parts.map((part: any) => ({
    url: `${BASE_URL}/parts/${part._id || part.id}`,
    lastModified: part.updatedAt ? new Date(part.updatedAt) : now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const auctionUrls: MetadataRoute.Sitemap = auctions.map((auction: any) => ({
    url: `${BASE_URL}/auctions/${auction._id || auction.id}`,
    lastModified: auction.updatedAt ? new Date(auction.updatedAt) : now,
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }));

  const brandUrls: MetadataRoute.Sitemap = brands.map((brand: any) => ({
    url: `${BASE_URL}/brands/${brand.key || brand._id || brand.id}`,
    lastModified: brand.updatedAt ? new Date(brand.updatedAt) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...carUrls,
    ...partUrls,
    ...auctionUrls,
    ...brandUrls,
  ];
}
