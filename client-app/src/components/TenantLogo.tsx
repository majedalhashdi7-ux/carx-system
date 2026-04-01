'use client';

import { useTenant } from '@/lib/TenantContext';
import Image from 'next/image';

interface TenantLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showName?: boolean;
}

export function TenantLogo({ 
  className = '', 
  width = 120, 
  height = 40,
  showName = false 
}: TenantLogoProps) {
  const { tenant, loading } = useTenant();

  if (loading) {
    return (
      <div className={`animate-pulse bg-white/10 rounded ${className}`} style={{ width, height }} />
    );
  }

  if (!tenant) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hmcar.okigo.net';
  const logoUrl = tenant.logo.startsWith('http') ? tenant.logo : `${baseUrl}${tenant.logo}`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src={logoUrl}
        alt={tenant.name}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
      {showName && (
        <span className="text-xl font-bold" style={{ color: tenant.theme.primaryColor }}>
          {tenant.name}
        </span>
      )}
    </div>
  );
}
