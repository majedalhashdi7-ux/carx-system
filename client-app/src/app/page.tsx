import { redirect } from 'next/navigation';

/**
 * الصفحة الرئيسية — تعيد التوجيه فوراً إلى صفحة السيارات
 * الصفحة التسويقية متاحة عبر /home
 */
export default function RootPage() {
    redirect('/cars');
}
