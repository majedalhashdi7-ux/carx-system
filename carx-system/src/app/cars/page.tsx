'use client';

import { useEffect, useState } from "react";
import CarCard3D from "@/components/CarCard3D";
import { api } from "@/lib/api";

export default function CarsGalleryPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [carsRes, brandsRes] = await Promise.all([
          api.cars.getAll(),
          api.brands.getAll()
        ]);
        
        if (carsRes.data?.data) {
          setCars(carsRes.data.data);
        } else if (carsRes.data?.cars) {
            setCars(carsRes.data.cars);
        }
        
        if (brandsRes.data?.brands) {
          setBrands(brandsRes.data.brands);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20 relative">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-luxury-gold/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              معرض <span className="text-luxury-gold">السيارات</span>
            </h1>
            <p className="text-gray-400 max-w-xl">
              تصفح مجموعتنا الحصرية من السيارات الفاخرة. نوفر لك الأفضل دائماً بمعايير عالمية.
            </p>
          </div>

          <div className="flex gap-4">
            <select className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:border-luxury-gold/50 cursor-pointer">
              <option value="" className="bg-black">جميع الماركات</option>
              {brands.map((b: any) => (
                <option key={b._id} value={b.slug} className="bg-black">{b.nameAr || b.name}</option>
              ))}
            </select>
            <select className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:border-luxury-gold/50 cursor-pointer">
              <option value="" className="bg-black">ترتيب حسب السعر</option>
              <option value="asc" className="bg-black">الأقل سعراً</option>
              <option value="desc" className="bg-black">الأعلى سعراً</option>
            </select>
          </div>
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
            </div>
        ) : cars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map((car: any) => (
                <CarCard3D key={car._id} car={{
                    id: car._id,
                    title: car.title,
                    price: `${car.priceSar || car.price} ريال`,
                    image: car.images && car.images.length > 0 ? car.images[0].url : 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=800',
                    brand: car.brand?.name || 'سيارة',
                    year: car.year,
                    specs: {
                        mileage: car.mileage ? `${car.mileage} كم` : "0 كم",
                        transmission: car.transmission === 'automatic' ? "أوتوماتيك" : "عادي",
                        fuel: car.fuelType === 'petrol' ? 'بنزين' : 'هايبرد'
                    }
                }} />
            ))}
            </div>
        ) : (
            <div className="text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xl">لا توجد سيارات معروضة حالياً.</p>
            </div>
        )}
      </div>
    </div>
  );
}
