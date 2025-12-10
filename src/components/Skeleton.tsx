"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white/90 rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function FeaturedCardSkeleton() {
  return (
    <div className="w-72 bg-white/90 rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[70px]">
      <Skeleton className="w-14 h-14 rounded-2xl" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function CouponCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex">
        <Skeleton className="w-24 h-24 rounded-none flex-shrink-0" />
        <div className="flex-1 p-3 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
      
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <CategorySkeleton key={i} />
        ))}
      </div>
      
      <div>
        <div className="flex justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2].map((i) => (
            <FeaturedCardSkeleton key={i} />
          ))}
        </div>
      </div>
      
      <div>
        <div className="flex justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RestaurantListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MyCouponsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <CouponCardSkeleton key={i} />
      ))}
    </div>
  );
}
