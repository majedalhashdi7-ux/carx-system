'use client';

import React from 'react';

export default function CarCardSkeleton() {
  return (
    <div className="relative h-[480px] w-full rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 p-2 animate-pulse">
      <div className="absolute inset-2 rounded-[2.2rem] bg-[#0A0A0A] p-6 flex flex-col justify-between overflow-hidden">
        
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-2/3">
            <div className="h-2 w-16 bg-luxury-gold/20 rounded-full" />
            <div className="h-4 bg-white/10 rounded-full w-full" />
          </div>
          <div className="h-5 w-12 bg-white/5 rounded-full" />
        </div>

        {/* Image Skeleton */}
        <div className="relative h-44 w-full my-6 bg-white/[0.03] rounded-2xl flex items-center justify-center overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] animate-ping" />
        </div>

        {/* Specs Skeleton */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-2xl space-y-2">
              <div className="w-4 h-4 rounded bg-luxury-gold/10" />
              <div className="w-8 h-2 rounded bg-white/10" />
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-2 w-10 bg-white/10 rounded-full" />
            <div className="h-5 w-24 bg-white/20 rounded-full" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10" />
        </div>

      </div>
    </div>
  );
}
