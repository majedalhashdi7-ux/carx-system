import { redirect } from 'next/navigation';

/**
 * الصفحة الرئيسية لـ CAR X
 * تقوم بالتحويل الفوري والمباشر إلى معرض السيارات (/cars)
 */
export default function Home() {
  redirect('/cars');
}
