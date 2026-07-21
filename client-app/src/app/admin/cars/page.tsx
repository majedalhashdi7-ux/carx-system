'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
    Plus, Download, RefreshCw,
    Car as CarIcon
} from 'lucide-react';
import NextLink from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api-original';
import { useToast } from '@/lib/ToastContext';
import AdminPageShell from '@/components/AdminPageShell';
import CarCard from './_components/CarCard';
import CarModal from './_components/CarModal';
import SearchAutocomplete, { type SearchSuggestion } from '@/components/SearchAutocomplete';

// ── نوع بيانات السيارة ──
type Car = {
    id: string;
    title: string;
    make: string | { name: string };
    model: string;
    year: number;
    price: number;
    category: string;
    images: string[];
    isActive: boolean;
    isSold: boolean;
    displayCurrency?: string;
    description?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    color?: string;
    listingType?: string;
    source?: 'hm_local' | 'korean_import';
    agency?: string | { _id: string; name: string };
    usdPrice?: number;
    krwPrice?: number;
    priceUsd?: number;
    priceKrw?: number;
};

// ── نوع بيانات نموذج الإضافة/التعديل ──
type FormData = {
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    usdPrice: number;
    krwPrice: number;
    category: string;
    images: string[];
    description: string;
    mileage: number;
    fuelType: string;
    transmission: string;
    color: string;
    isActive: boolean;
    displayCurrency: string;
    listingType: string;
    source: 'hm_local' | 'korean_import';
    agency: string;
};

// ── النموذج الافتراضي الفارغ ──
const EMPTY_FORM: FormData = {
    title: '', make: '', model: '',
    year: new Date().getFullYear(),
    price: 0, usdPrice: 0, krwPrice: 0,
    category: 'sedan', images: [''], description: '',
    mileage: 0, fuelType: 'Petrol', transmission: 'Automatic',
    color: '', isActive: true, displayCurrency: 'SAR', listingType: 'store', source: 'hm_local',
    agency: ''
};

function CarsContent() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    const [cars, setCars] = useState<Car[]>([]);
    const [totalCarsCount, setTotalCarsCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [brands, setBrands] = useState<Array<{_id: string, name: string}>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currencySettings, setCurrencySettings] = useState({ usdToSar: 3.75, usdToKrw: 1350 });

    const usdToSar = currencySettings.usdToSar || 3.75;
    const usdToKrw = currencySettings.usdToKrw || 1350;

    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            // جلب كل السيارات معاً (محلية + مستوردة + كورية) في معرض موحد
            const res = await api.cars.list({ page, limit: 100, status: 'all' });
            if (res.success) {
                setCars(res.data?.cars || []);
                setTotalCarsCount(res.data?.pagination?.total || 0);
                setTotalPages(res.data?.pagination?.pages || 1);
            }

            const globalSettings = await api.settings.getPublic();
            if (globalSettings.success && globalSettings.data?.currencySettings) {
                setCurrencySettings(globalSettings.data.currencySettings);
            }

            const brandsRes = await api.brands.list('cars', {});
            if (brandsRes.success) setBrands((brandsRes as any).brands || []);
        } catch (err) {
            console.error('Failed to load cars:', err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { loadData(); }, [loadData]);


    const handlePriceChange = (field: 'sar' | 'usd' | 'krw', rawValue: string) => {
        const value = parseFloat(rawValue) || 0;
        let sarPrice = 0, usdPrice = 0, krwPrice = 0;

        if (field === 'sar') {
            sarPrice = value;
            usdPrice = parseFloat((sarPrice / usdToSar).toFixed(2));
            krwPrice = Math.round(usdPrice * usdToKrw);
        } else if (field === 'usd') {
            usdPrice = value;
            sarPrice = parseFloat((usdPrice * usdToSar).toFixed(2));
            krwPrice = Math.round(usdPrice * usdToKrw);
        } else {
            krwPrice = value;
            usdPrice = parseFloat((krwPrice / usdToKrw).toFixed(2));
            sarPrice = parseFloat((usdPrice * usdToSar).toFixed(2));
        }

        setFormData(prev => ({ ...prev, price: sarPrice, usdPrice, krwPrice }));
    };

    const handleEdit = (car: Car) => {
        setEditingCar(car);
        const sarPrice = car.price || 0;
        const usd = car.usdPrice ?? (car.priceUsd || parseFloat((sarPrice / usdToSar).toFixed(2)));
        const krw = car.krwPrice ?? (car.priceKrw || Math.round((usd * usdToKrw)));
        const makeValue = typeof car.make === 'object' ? (car.make?.name || '') : (car.make || '');
        setFormData({
            title: car.title, make: makeValue, model: car.model, year: car.year,
            price: sarPrice, usdPrice: usd, krwPrice: krw,
            category: car.category, images: car.images || [''],
            description: car.description || '', mileage: car.mileage || 0,
            fuelType: car.fuelType || 'Petrol', transmission: car.transmission || 'Automatic',
            color: car.color || '', isActive: car.isActive !== false,
            displayCurrency: car.displayCurrency || 'SAR',
            listingType: car.listingType || 'store',
            source: car.source || (car.listingType === 'showroom' ? 'korean_import' : 'hm_local'),
            agency: typeof car.agency === 'object' ? (car.agency?._id || '') : (car.agency || '')
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            ...EMPTY_FORM,
            source: 'hm_local',
            listingType: 'store'
        });
        setEditingCar(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const submitData = { 
                ...formData,
                source: formData.source || 'hm_local',
                listingType: formData.listingType || (formData.source === 'korean_import' ? 'showroom' : 'store'),
                priceUsd: formData.usdPrice,
                priceKrw: formData.krwPrice
            };

            if (editingCar) {
                await api.cars.update(editingCar.id, submitData);
            } else {
                await api.cars.create(submitData);
            }
            setShowModal(false);
            resetForm();
            await loadData();
            showToast(isRTL ? '✅ تم حفظ البيانات بنجاح!' : '✅ Data saved!', 'success');
        } catch (err) {
            console.error('فشل حفظ البيانات:', err);
            showToast(isRTL ? '❌ فشل في الحفظ' : '❌ Save failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه السيارة؟' : 'Delete this car?')) return;
        try {
            await api.cars.delete(id);
            loadData();
            showToast(isRTL ? '🗑️ تم الحذف' : '🗑️ Deleted', 'success');
        } catch {
            showToast(isRTL ? '❌ فشل الحذف' : '❌ Delete failed', 'error');
        }
    };

    // Currency saving is now handled via the Import Hub settings
    const handleSaveCurrency = async () => { /* moved to import hub */ };

    const handleMarkSold = async (id: string, title: string) => {
        const confirmed = confirm(isRTL
            ? `هل تأكد أنه تم بيع: ${title}؟\nسيتم إخفاؤها من المعرض فوراً.`
            : `Confirm sale of: ${title}?`
        );
        if (!confirmed) return;

        const soldPriceStr = prompt(isRTL ? 'أدخل سعر البيع الفعلي (اختياري):' : 'Enter sold price (optional):');
        const soldPrice = soldPriceStr ? parseFloat(soldPriceStr) : undefined;

        try {
            await api.cars.markSold(id, soldPrice);
            loadData();
            showToast(isRTL ? '✅ تم تسجيل البيع!' : '✅ Sale recorded!', 'success');
        } catch (err) {
            console.error('فشل تسجيل البيع:', err);
            showToast(isRTL ? '❌ فشل تسجيل البيع' : '❌ Sale record failed', 'error');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.cars.update(id, { isActive: !currentStatus });
            loadData();
            showToast(!currentStatus ? (isRTL ? '👁️ تم إظهار السيارة' : '👁️ Car shown') : (isRTL ? '🙈 تم إخفاء السيارة' : '🙈 Car hidden'), 'success');
        } catch {
            showToast(isRTL ? '❌ فشل التحديث' : '❌ Update failed', 'error');
        }
    };

    const activeCount = cars.filter(c => c.isActive && !c.isSold).length;
    const soldCount = cars.filter(c => c.isSold).length;

    // فلترة السيارات بالبحث
    const filteredCars = searchQuery.trim()
        ? cars.filter(c => {
            const q = searchQuery.toLowerCase();
            const make = typeof c.make === 'object' ? c.make?.name : c.make;
            return (
                c.title?.toLowerCase().includes(q) ||
                (make || '').toLowerCase().includes(q) ||
                c.model?.toLowerCase().includes(q) ||
                String(c.year || '').includes(q)
            );
        })
        : cars;

    // اقتراحات البحث
    const carSuggestions: SearchSuggestion[] = cars.map(c => {
        const make = typeof c.make === 'object' ? c.make?.name : c.make;
        return {
            id: c.id,
            label: c.title || `${make} ${c.model} ${c.year}`,
            sublabel: `${make || ''} · ${c.year || ''}`,
            value: c.id,
        };
    });

    return (
        <div className="relative min-h-screen text-white font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <AdminPageShell
                icon={CarIcon}
                accentColor="orange"
                title={isRTL ? 'إدارة معرض السيارات' : 'VEHICLE SHOWROOM'}
                titleEn="UNIFIED SHOWROOM"
                subtitle={isRTL ? 'إضافة وتعديل وإدارة جميع السيارات - المحلية والمستوردة في معرض موحد' : 'Add, edit and manage all vehicles — local & imported — in one unified showroom'}
                backHref="/admin/dashboard"
                isRTL={isRTL}
                stats={[
                    { label: isRTL ? 'إجمالي السيارات' : 'TOTAL', value: totalCarsCount, color: 'text-orange-400' },
                    { label: isRTL ? 'نشطة' : 'ACTIVE', value: activeCount, color: 'text-emerald-400' },
                    { label: isRTL ? 'مباعة' : 'SOLD', value: soldCount, color: 'text-white/40' },
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            title={isRTL ? 'إضافة سيارة جديدة' : 'Add New Vehicle'}
                            className="h-11 px-6 rounded-2xl bg-orange-500 text-black font-black text-xs uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {isRTL ? 'إضافة سيارة' : 'ADD VEHICLE'}
                        </button>
                        <NextLink
                            href="/admin/import"
                            className="h-11 px-5 rounded-2xl border border-blue-400/30 text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-400/10 transition-all flex items-center gap-2 bg-blue-500/5"
                        >
                            <Download className="w-4 h-4" />
                            {isRTL ? 'بوابة الاستيراد' : 'IMPORT HUB'}
                        </NextLink>
                    </div>
                }
            >

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-6">
                        <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
                        <span className="cockpit-mono text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">جاري تحميل السيارات...</span>
                    </div>
                ) : cars.length === 0 ? (
                    <div className="ck-empty py-32">
                        <div className="ck-empty-icon"><CarIcon className="w-8 h-8" /></div>
                        <p className="cockpit-mono text-sm">{isRTL ? 'لا توجد سيارات في المعرض بعد' : 'NO VEHICLES IN SHOWROOM YET'}</p>
                        <div className="flex items-center gap-3 mt-8">
                            <button onClick={() => { resetForm(); setShowModal(true); }} className="ck-btn-primary h-12 px-8">
                                {isRTL ? 'إضافة أول سيارة' : 'ADD FIRST VEHICLE'}
                            </button>
                            <NextLink href="/admin/import" className="ck-btn-primary h-12 px-8 border border-blue-400/30 bg-blue-500/5 text-blue-400 hover:bg-blue-400/10">
                                {isRTL ? 'استيراد من كوريا' : 'IMPORT FROM KOREA'}
                            </NextLink>
                        </div>
                    </div>

                ) : (
                    <>
                        {/* بحث ذكي */}
                        <SearchAutocomplete
                            placeholder={isRTL ? 'ابحث عن سيارة (الاسم، الموديل، السنة...)' : 'Search car (name, model, year...)'}
                            suggestions={carSuggestions}
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSelect={item => setSearchQuery(item.label)}
                            isRTL={isRTL}
                            className="mb-6"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                            {filteredCars.map((car, i) => (
                                <CarCard
                                    key={car.id}
                                    car={car}
                                    index={i}
                                    usdToSar={usdToSar}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onMarkSold={handleMarkSold}
                                    onToggleActive={handleToggleActive}
                                />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 py-8 mb-12 bg-black/40 rounded-xl border border-white/5">
                                <button 
                                    disabled={page === 1} 
                                    onClick={() => setPage(page - 1)} 
                                    className="ck-btn-primary bg-white/5 hover:bg-white/10 text-white px-6 h-10 disabled:opacity-20 disabled:cursor-not-allowed border-none shadow-none text-xs"
                                >
                                    {isRTL ? 'السابق' : 'Prev'}
                                </button>
                                <span className="text-white/50 text-xs font-mono font-bold px-4 tracking-widest">{page} / {totalPages}</span>
                                <button 
                                    disabled={page >= totalPages} 
                                    onClick={() => setPage(page + 1)} 
                                    className="ck-btn-primary bg-orange-500 hover:bg-orange-400 text-black px-6 h-10 disabled:opacity-20 disabled:cursor-not-allowed border-none shadow-none text-xs"
                                >
                                    {isRTL ? 'التالي' : 'Next'}
                                </button>
                            </div>
                        )}
                    </>
                )}

            </AdminPageShell>

            <CarModal
                isOpen={showModal}
                isEditing={!!editingCar}
                formData={formData}
                submitting={submitting}
                usdToSar={usdToSar}
                usdToKrw={usdToKrw}
                brands={brands}
                onClose={() => { setShowModal(false); resetForm(); }}
                onSubmit={handleSubmit}
                onFormChange={setFormData}
                onPriceChange={handlePriceChange}
            />
        </div>
    );
}

export default function AdminCarsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CarsContent />
        </Suspense>
    );
}
