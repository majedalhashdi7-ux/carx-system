/* eslint-disable react/display-name */
/**
 * Dynamic Component Imports - Fixed Version
 * تحميل المكونات الثقيلة بشكل ديناميكي لتحسين الأداء
 */

import dynamic from 'next/dynamic';
import { GridSkeleton, DetailPageSkeleton, TableSkeleton } from './LoadingSkeleton';

// ─── Helper للتعامل مع المكونات غير الموجودة ───
const createFallback = (name: string) => {
  return () => (
    <div className="w-full p-8 bg-white/5 rounded-lg text-center">
      <p className="text-white/70">المكون {name} غير متاح حالياً</p>
    </div>
  );
};

// ─── Admin Components (Fallback Only) ───
export const AdminDashboard = dynamic(
  () => Promise.resolve({ default: createFallback('لوحة التحكم') }),
  {
    ssr: false,
    loading: () => <TableSkeleton rows={10} />,
  }
);

export const AdminCarManager = dynamic(
  () => Promise.resolve({ default: createFallback('إدارة السيارات') }),
  {
    ssr: false,
    loading: () => <GridSkeleton count={6} type="car" />,
  }
);

export const AdminPartManager = dynamic(
  () => Promise.resolve({ default: createFallback('إدارة القطع') }),
  {
    ssr: false,
    loading: () => <GridSkeleton count={6} type="part" />,
  }
);

// ─── 3D/Heavy Graphics Components ───
export const ThreeScene = dynamic(
  () => Promise.resolve({ default: createFallback('المشهد ثلاثي الأبعاد') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <p className="text-white/50">جاري تحميل المشهد ثلاثي الأبعاد...</p>
      </div>
    ),
  }
);

export const Car360Viewer = dynamic(
  () => Promise.resolve({ default: createFallback('عارض 360') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video bg-white/5 rounded-2xl animate-pulse" />
    ),
  }
);

// ─── Chart Components ───
export const AnalyticsChart = dynamic(
  () => Promise.resolve({ default: createFallback('الرسم البياني') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-white/5 rounded-2xl animate-pulse" />
    ),
  }
);

export const RevenueChart = dynamic(
  () => Promise.resolve({ default: createFallback('رسم الإيرادات') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-white/5 rounded-2xl animate-pulse" />
    ),
  }
);

// ─── Other Components ───
export const RichTextEditor = dynamic(
  () => Promise.resolve({ 
    default: () => <textarea className="w-full p-4 rounded-lg bg-white/5 text-white" placeholder="محرر النصوص غير متاح" /> 
  }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 bg-white/5 rounded-lg animate-pulse" />
    ),
  }
);

export const PDFViewer = dynamic(
  () => Promise.resolve({ default: createFallback('عارض PDF') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-white/5 rounded-lg animate-pulse" />
    ),
  }
);

export const VideoPlayer = dynamic(
  () => Promise.resolve({ 
    default: () => <video controls className="w-full rounded-lg bg-black" /> 
  }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video bg-white/5 rounded-lg animate-pulse" />
    ),
  }
);

export const LocationMap = dynamic(
  () => Promise.resolve({ default: createFallback('الخريطة') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-white/5 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-white/50">جاري تحميل الخريطة...</p>
      </div>
    ),
  }
);

export const LiveChat = dynamic(
  () => Promise.resolve({ default: createFallback('الدردشة المباشرة') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-white/5 rounded-lg animate-pulse" />
    ),
  }
);

export const AuctionCalendar = dynamic(
  () => Promise.resolve({ default: createFallback('تقويم المزادات') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-white/5 rounded-lg animate-pulse" />
    ),
  }
);

export const ImageGallery = dynamic(
  () => Promise.resolve({ default: createFallback('معرض الصور') }),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    ),
  }
);

export const QRCodeGenerator = dynamic(
  () => Promise.resolve({ default: createFallback('مولد QR') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-48 h-48 bg-white/5 rounded-lg animate-pulse mx-auto" />
    ),
  }
);

export const BarcodeScanner = dynamic(
  () => Promise.resolve({ default: createFallback('ماسح الباركود') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video bg-white/5 rounded-lg animate-pulse" />
    ),
  }
);

export const ExportToExcel = dynamic(
  () => Promise.resolve({ 
    default: () => <button disabled className="px-4 py-2 bg-white/10 rounded-lg text-white/50">تصدير Excel</button> 
  }),
  {
    ssr: false,
  }
);

export const ExportToPDF = dynamic(
  () => Promise.resolve({ 
    default: () => <button disabled className="px-4 py-2 bg-white/10 rounded-lg text-white/50">تصدير PDF</button> 
  }),
  {
    ssr: false,
  }
);

export const SocialShare = dynamic(
  () => Promise.resolve({ default: createFallback('المشاركة الاجتماعية') }),
  {
    ssr: false,
  }
);

export const PaymentForm = dynamic(
  () => Promise.resolve({ default: createFallback('نموذج الدفع') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    ),
  }
);

export const NotificationCenter = dynamic(
  () => Promise.resolve({ default: createFallback('مركز الإشعارات') }),
  {
    ssr: false,
    loading: () => (
      <div className="w-80 h-96 bg-white/5 rounded-lg animate-pulse" />
    ),
  }
);