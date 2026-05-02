'use client';

/**
 * Breadcrumb - مسار التنقل
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm" dir="rtl">
      {/* الرئيسية */}
      <Link href="/">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </motion.div>
      </Link>

      {/* العناصر */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronLeft className="w-4 h-4 text-gray-600" />
            
            {item.href && !isLast ? (
              <Link href={item.href}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  {item.label}
                </motion.span>
              </Link>
            ) : (
              <span className={`px-3 py-1.5 rounded-lg ${isLast ? 'text-white font-bold bg-white/5' : 'text-gray-400'}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
