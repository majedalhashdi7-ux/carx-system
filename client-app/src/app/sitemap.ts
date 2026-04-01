/**
 * Dynamic Sitemap Generator
 * توليد خريطة الموقع ديناميكياً من قاعدة البيانات
 */

import { MetadataRoute } from 'next';

const BASE_URL = 'https://hmcar.okigo.net';

// Helper function to fetch from API
async function fetchAPI(endpoint: string) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Sitemap fetch error for ${endpoint}:`, error);
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/cars`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/parts`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auctions`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/brands`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/showroom`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Fetch cars
  const carsData = await fetchAPI('/api/v2/cars?limit=1000&status=available');
  const cars = carsData?.data?.cars || [];
  
  const carUrls: MetadataRoute.Sitemap = cars.map((car: any) => ({
    url: `${BASE_URL}/cars/${car._id || car.id}`,
    lastModified: car.updatedAt ? new Date(car.updatedAt) : now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Fetch parts
  const partsData = await fetchAPI('/api/v2/parts?limit=1000&status=available');
  const parts = partsData?.data?.parts || [];
  
  const partUrls: MetadataRoute.Sitemap = parts.map((part: any) => ({
    url: `${BASE_URL}/parts/${part._id || part.id}`,
    lastModified: part.updatedAt ? new Date(part.updatedAt) : now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Fetch active auctions
  const auctionsData = await fetchAPI('/api/v2/auctions?status=running&limit=100');
  const auctions = auctionsData?.data?.auctions || [];
  
  const auctionUrls: MetadataRoute.Sitemap = auctions.map((auction: any) => ({
    url: `${BASE_URL}/auctions/${auction._id || auction.id}`,
    lastModified: auction.updatedAt ? new Date(auction.updatedAt) : now,
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }));

  // Fetch brands
  const brandsData = await fetchAPI('/api/v2/brands?limit=100');
  const brands = brandsData?.data?.brands || [];
  
  const brandUrls: MetadataRoute.Sitemap = brands.map((brand: any) => ({
    url: `${BASE_URL}/brands/${brand._id || brand.id}`,
    lastModified: brand.updatedAt ? new Date(brand.updatedAt) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Combine all URLs
  return [
    ...staticPages,
    ...carUrls,
    ...partUrls,
    ...auctionUrls,
    ...brandUrls,
  ];
}
