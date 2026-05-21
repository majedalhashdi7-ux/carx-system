import { MetadataRoute } from 'next';

// Force dynamic rendering to avoid timeout during static build
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://carx-system.vercel.app';

  // المسارات الثابتة للمنصة
  const staticPaths: MetadataRoute.Sitemap = [
    '',
    '/showroom',
    '/parts',
    '/brands',
    '/about',
    '/contact',
    '/login',
    '/faq',
    '/terms',
    '/privacy',
    '/shipping',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v2';
  const carPaths: MetadataRoute.Sitemap = [];
  const partPaths: MetadataRoute.Sitemap = [];

  // جلب روابط السيارات - مع timeout آمن
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 ثوان كحد أقصى
    const carsRes = await fetch(`${apiUrl}/cars?limit=200`, {
      headers: { 'X-Tenant-ID': 'carx' },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (carsRes.ok) {
      const carsData = await carsRes.json();
      const carsList: Array<{ id?: string; _id?: string; updatedAt?: string; createdAt?: string }> = carsData?.data?.cars || carsData?.cars || [];
      carsList.forEach((car) => {
        carPaths.push({
          url: `${baseUrl}/showroom/${car.id || car._id}`,
          lastModified: new Date(car.updatedAt || car.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      });
    }
  } catch {
    // Silently skip - backend not running during build
  }

  // جلب روابط قطع الغيار - مع timeout آمن
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const partsRes = await fetch(`${apiUrl}/parts?limit=200`, {
      headers: { 'X-Tenant-ID': 'carx' },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (partsRes.ok) {
      const partsData = await partsRes.json();
      const partsList: Array<{ id?: string; _id?: string; updatedAt?: string; createdAt?: string }> = partsData?.parts || partsData?.data?.parts || [];
      partsList.forEach((part) => {
        partPaths.push({
          url: `${baseUrl}/parts/${part.id || part._id}`,
          lastModified: new Date(part.updatedAt || part.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        });
      });
    }
  } catch {
    // Silently skip
  }

  return [...staticPaths, ...carPaths, ...partPaths];
}

