'use client';

import { useTenant } from '@/lib/TenantContext';
import { ButtonHTMLAttributes } from 'react';

interface TenantThemeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  children: React.ReactNode;
}

export function TenantThemeButton({ 
  variant = 'primary', 
  children, 
  className = '',
  style = {},
  ...props 
}: TenantThemeButtonProps) {
  const { tenant } = useTenant();

  if (!tenant) {
    return (
      <button className={className} style={style} {...props}>
        {children}
      </button>
    );
  }

  const colors = {
    primary: tenant.theme.primaryColor,
    secondary: tenant.theme.secondaryColor,
    accent: tenant.theme.accentColor,
  };

  const buttonStyle = {
    backgroundColor: colors[variant],
    color: variant === 'primary' ? '#000' : tenant.theme.textColor,
    ...style,
  };

  return (
    <button 
      className={`px-6 py-3 rounded-lg font-bold transition-all hover:opacity-90 ${className}`}
      style={buttonStyle}
      {...props}
    >
      {children}
    </button>
  );
}
