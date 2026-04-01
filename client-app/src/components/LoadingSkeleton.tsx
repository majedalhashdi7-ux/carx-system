/**
 * مكونات Loading Skeletons
 * تحسين تجربة المستخدم أثناء تحميل البيانات
 */

export function CarCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-white/10 rounded-2xl mb-4" />
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
      <div className="h-6 bg-white/10 rounded w-2/3" />
    </div>
  );
}

export function PartCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-white/10 rounded-2xl mb-4" />
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
      <div className="h-6 bg-white/10 rounded w-2/3" />
    </div>
  );
}

export function BrandCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-3" />
      <div className="h-4 bg-white/10 rounded w-2/3 mx-auto" />
    </div>
  );
}

export function AuctionCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-white/10 rounded-2xl mb-4" />
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
      <div className="flex gap-2">
        <div className="h-8 bg-white/10 rounded flex-1" />
        <div className="h-8 bg-white/10 rounded flex-1" />
      </div>
    </div>
  );
}

export function GridSkeleton({ 
  count = 6, 
  type = 'car' 
}: { 
  count?: number; 
  type?: 'car' | 'part' | 'brand' | 'auction';
}) {
  const SkeletonComponent = {
    car: CarCardSkeleton,
    part: PartCardSkeleton,
    brand: BrandCardSkeleton,
    auction: AuctionCardSkeleton,
  }[type];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="animate-pulse max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* صورة */}
        <div className="aspect-video bg-white/10 rounded-2xl" />
        
        {/* التفاصيل */}
        <div className="space-y-4">
          <div className="h-8 bg-white/10 rounded w-3/4" />
          <div className="h-6 bg-white/10 rounded w-1/2" />
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-5/6" />
          <div className="h-12 bg-white/10 rounded w-full mt-6" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-12 bg-white/10 rounded flex-1" />
          <div className="h-12 bg-white/10 rounded flex-1" />
          <div className="h-12 bg-white/10 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}
