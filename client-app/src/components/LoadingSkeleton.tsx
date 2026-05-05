export function GridSkeleton({ count = 6, type = 'default' }: { count?: number; type?: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={`${type}-${index}`} className="p-4 bg-white/5 rounded-lg animate-pulse h-36" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={`row-${index}`} className="flex gap-4 p-4 bg-white/5 rounded-lg animate-pulse">
          <div className="w-12 h-12 bg-white/10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded" />
            <div className="h-4 w-3/4 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-white/10 rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/10 rounded w-1/4" />
        </div>
        <div className="h-8 bg-white/10 rounded w-full" />
      </div>
    </div>
  );
}

export function PartCardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden animate-pulse p-4">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-white/10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-6 bg-white/10 rounded w-1/3 mt-2" />
        </div>
      </div>
    </div>
  );
}

export function AuctionCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-8 bg-white/10 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-2/3"></div>
    </div>
  );
}