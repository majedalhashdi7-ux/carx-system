import { redirect } from 'next/navigation';

/**
 * الصفحة الرئيسية الأساسية لـ HM CAR
 * تقوم بالتحويل الفوري والمباشر إلى معرض السيارات (/cars)
 */
export default function RootPage() {
    redirect('/cars');
}
