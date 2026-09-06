'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { 
    Plus, Download, RefreshCw, Trash2,
    Car as CarIcon, Globe
} from 'lucide-react';
import NextLink from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api-original';
import { useToast } from '@/lib/ToastContext';
import AdminPageShell from '@/components/AdminPageShell';
import CarCard from './_components/CarCard';
import CarModal from './_components/CarModal';
import InlineImportModal from '@/components/admin/InlineImportModal';
import QuickImportBar from '@/components/admin/QuickImportBar';
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
    _id?: string;
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
    const [scraping, setScraping] = useState(false);
    const [showInlineImport, setShowInlineImport] = useState(false);
    const [brands, setBrands] = useState<Array<{_id: string, name: string}>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currencySettings, setCurrencySettings] = useState({ usdToSar: 3.75, usdToKrw: 1350 });

    const usdToSar = currencySettings.usdToSar || 3.75;
    const usdToKrw = currencySettings.usdToKrw || 1350;

    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            // جلب كل السيارات معاً (محلية + مستوردة + كورية) في معرض موحد بدون كاش
            const res = await api.cars.list({ page, limit: 100, status: 'all', nocache: 'true' });
            if (res.success) {
                const carsList = Array.isArray(res.data) ? res.data : (res.data?.cars || (res as any).cars || []);
                setCars(carsList);
                const total = (res as any).pagination?.total || (res as any).total || res.data?.pagination?.total || carsList.length;
                const pages = (res as any).pagination?.pages || (res as any).pages || res.data?.pagination?.pages || Math.max(1, Math.ceil(total / 100));
                setTotalCarsCount(total);
                setTotalPages(pages);
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

    // ── استيراد سيارات كوريا التلقائي مع Cooldown 45 ثانية ──
    const ENCAR_COOLDOWN_MS = 45_000;
    const ENCAR_LS_KEY = 'hm_encar_last_import';
    const [encarCooldown, setEncarCooldown] = useState(0); // ثواني متبقية
    const cooldownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const last = parseInt(localStorage.getItem(ENCAR_LS_KEY) || '0', 10);
        const elapsed = Date.now() - last;
        if (elapsed < ENCAR_COOLDOWN_MS) {
            const remaining = Math.ceil((ENCAR_COOLDOWN_MS - elapsed) / 1000);
            setEncarCooldown(remaining);
            cooldownRef.current = setInterval(() => {
                setEncarCooldown(prev => {
                    if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
    }, []);

    const handleScrapeKorea = useCallback(async () => {
        if (scraping || encarCooldown > 0) return;
        setScraping(true);
        try {
            showToast(isRTL ? '⏳ جاري جلب 20 سيارة من كوريا...' : '⏳ Fetching 20 cars from Korea...', 'info');
            const res = await api.import.showroom(20, '');
            if (res?.success) {
                const imported = res.imported ?? res.totalImported ?? 0;
                const skipped = res.skipped ?? res.totalSkipped ?? 0;
                showToast(
                    isRTL
                        ? `✅ تم استيراد ${imported} سيارة${skipped ? ` (${skipped} موجودة مسبقاً)` : ''}`
                        : `✅ Imported ${imported} cars${skipped ? ` (${skipped} skipped)` : ''}`,
                    'success'
                );
                localStorage.setItem(ENCAR_LS_KEY, String(Date.now()));
                setEncarCooldown(Math.ceil(ENCAR_COOLDOWN_MS / 1000));
                cooldownRef.current = setInterval(() => {
                    setEncarCooldown(prev => {
                        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
                        return prev - 1;
                    });
                }, 1000);
                await loadData();
            } else {
                showToast(res?.error || (isRTL ? '❌ فشل الاستيراد' : '❌ Import failed'), 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Error', 'error');
        } finally {
            setScraping(false);
        }
    }, [scraping, encarCooldown, isRTL, showToast, loadData]);

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
            // [[FIX]] تنقية الصور الفارغة قبل الإرسال لمنع محو الصور الأصلية عند التعديل
            const cleanImages = (formData.images || []).filter(img => img.trim() !== '');
            const submitData = { 
                ...formData,
                images: cleanImages.length > 0 ? cleanImages : (editingCar as any)?.images || [],
                source: formData.source || 'hm_local',
                listingType: formData.listingType || (formData.source === 'korean_import' ? 'showroom' : 'store'),
                priceUsd: formData.usdPrice,
                priceKrw: formData.krwPrice
            };

            if (editingCar) {
                // [[FIX]] استخدام _id أو id بالترتيب الصحيح
                const targetId = (editingCar as any)._id || editingCar.id;
                const res = await api.cars.update(targetId, submitData);
                if (!res || res.success === false) throw new Error((res as any)?.message || 'Update failed');
            } else {
                const res = await api.cars.create(submitData);
                if (!res || res.success === false) throw new Error((res as any)?.message || 'Create failed');
            }
            setShowModal(false);
            resetForm();
            await loadData();
            showToast(isRTL ? '✅ تم حفظ البيانات بنجاح!' : '✅ Data saved!', 'success');
        } catch (err: any) {
            console.error('فشل حفظ البيانات:', err);
            showToast(err.message || (isRTL ? '❌ فشل في الحفظ' : '❌ Save failed'), 'error');
        } finally {
            setSubmitting(false);
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه السيارة نهائياً؟' : 'Delete this car permanently?')) return;
        
        // تحديث فوري للشاشة قبل انتظار السيرفر
        setCars(prev => prev.filter(c => c._id !== id && c.id !== id));
        setTotalCarsCount(prev => Math.max(0, prev - 1));

        try {
            const res = await api.cars.delete(id);
            if (res && res.success !== false) {
                showToast(isRTL ? '🗑️ تم حذف السيارة بنجاح من المعرض' : '🗑️ Car deleted successfully', 'success');
            } else {
                showToast((res as any)?.message || (isRTL ? '❌ فشل الحذف' : '❌ Delete failed'), 'error');
            }
            await loadData();
        } catch (err: any) {
            console.error('Delete car error:', err);
            showToast(err.message || (isRTL ? '❌ فشل الحذف من السيرفر' : '❌ Server delete failed'), 'error');
            await loadData();
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

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleToggleSelect = (id: string) => {
        if (!id) return;
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const allIds = filteredCars.map(c => c.id || c._id || '').filter(Boolean);
        if (selectedIds.length === allIds.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allIds);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(isRTL ? `هل أنت متأكد من حذف ${selectedIds.length} سيارات محددة؟` : `Delete ${selectedIds.length} selected cars?`)) return;
        try {
            showToast(isRTL ? 'جاري حذف السيارات المحددة...' : 'Deleting selected cars...', 'info');
            // [[FIX]] استخدام Promise.allSettled بدل for...of حتى لا يتوقف عند أول خطأ
            const results = await Promise.allSettled(
                selectedIds.map(id => api.cars.delete(id))
            );
            const failed = results.filter(r => r.status === 'rejected').length;
            const succeeded = results.length - failed;
            setSelectedIds([]);
            if (failed === 0) {
                showToast(isRTL ? `تم حذف ${succeeded} سيارة بنجاح!` : `${succeeded} cars deleted!`, 'success');
            } else {
                showToast(isRTL ? `تم حذف ${succeeded} وفشل ${failed} سيارة` : `Deleted ${succeeded}, failed ${failed}`, 'error');
            }
            await loadData();
        } catch {
            showToast(isRTL ? 'فشل حذف بعض السيارات' : 'Delete failed', 'error');
            await loadData();
        }
    };

    const handleDeleteAll = async () => {
        if (cars.length === 0) return;
        if (!confirm(isRTL ? `تحذير: هل أنت متأكد من حذف كافة السيارات (${cars.length} سيارة)؟` : `Delete ALL ${cars.length} cars?`)) return;
        try {
            showToast(isRTL ? 'جاري تنظيف المعرض...' : 'Clearing showroom...', 'info');
            // [[FIX]] حذف متوازي بدل تسلسلي
            const allIds = cars.map(c => c._id || c.id).filter(Boolean) as string[];
            await Promise.allSettled(allIds.map(id => api.cars.delete(id)));
            setSelectedIds([]);
            showToast(isRTL ? 'تم مسح المعرض بالكامل بنجاح!' : 'Showroom cleared!', 'success');
            await loadData();
        } catch {
            showToast(isRTL ? 'فشل مسح المعرض' : 'Clear failed', 'error');
            await loadData();
        }
    };


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
                        <button
                            onClick={handleScrapeKorea}
                            disabled={scraping || encarCooldown > 0}
                            title={isRTL ? '🇰🇷 جلب 20 سيارة تلقائياً من Encar كوريا' : '🇰🇷 Auto-import 20 cars from Encar Korea'}
                            className="h-11 px-5 rounded-2xl border border-blue-400/30 text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-400/10 transition-all flex items-center gap-2 bg-blue-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {scraping
                                ? <><RefreshCw className="w-4 h-4 animate-spin" />{isRTL ? 'جاري الجلب...' : 'IMPORTING...'}</>
                                : encarCooldown > 0
                                ? <><Globe className="w-4 h-4" />{isRTL ? `انتظر ${encarCooldown}ث` : `Wait ${encarCooldown}s`}</>
                                : <><Globe className="w-4 h-4" />{isRTL ? '🇰🇷 جلب سيارات كوريا' : '🇰🇷 IMPORT KOREA'}</>
                            }
                        </button>
                    </div>
                }
            >
                <QuickImportBar
                    type="car"
                    onSuccess={loadData}
                    className="mb-6"
                />

                <InlineImportModal
                    isOpen={showInlineImport}
                    onClose={() => setShowInlineImport(false)}
                    type="car"
                    onSuccess={loadData}
                />

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-6">
                        <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
                        <span className="cockpit-mono text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">جاري تحميل السيارات...</span>
                    </div>
                ) : cars.length === 0 ? (
                    <div className="ck-empty py-32">
                        <div className="ck-empty-icon"><CarIcon className="w-8 h-8" /></div>
                        <p className="cockpit-mono text-sm">{isRTL ? 'لا توجد سيارات في المعرض بعد' : 'NO VEHICLES IN SHOWROOM YET'}</p>
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                            <button onClick={handleScrapeKorea} disabled={scraping} className="ck-btn-primary h-12 px-8 border border-blue-400/40 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center gap-2">
                                <Download className={cn("w-4 h-4", scraping && "animate-spin")} />
                                {scraping ? (isRTL ? 'جاري الاستيراد...' : 'IMPORTING...') : (isRTL ? 'استيراد السيارات الكورية الآن' : 'IMPORT KOREAN CARS NOW')}
                            </button>
                            <button onClick={() => { resetForm(); setShowModal(true); }} className="ck-btn-primary h-12 px-8">
                                {isRTL ? 'إضافة أول سيارة يدوياً' : 'ADD FIRST VEHICLE'}
                            </button>
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

                        {/* شريط الإجراءات الجماعية وتحديد الكل */}
                        <div className="flex items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex-wrap">
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-white/80 hover:text-white select-none">
                                    <input
                                        type="checkbox"
                                        checked={filteredCars.length > 0 && selectedIds.length === filteredCars.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-white/30 bg-black/50 text-orange-500 focus:ring-orange-500 accent-orange-500"
                                    />
                                    <span>{isRTL ? 'تحديد الكل' : 'Select All'} ({selectedIds.length} / {filteredCars.length})</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={handleDeleteSelected}
                                        className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {isRTL ? `حذف السيارات المحددة (${selectedIds.length})` : `Delete Selected (${selectedIds.length})`}
                                    </button>
                                )}
                                {cars.length > 0 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        className="px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400/70 text-xs font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {isRTL ? 'حذف كافة السيارات بالمعرض' : 'Delete All Showroom Cars'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                            {filteredCars.map((car, i) => {
                                const carId = car.id || car._id || '';
                                return (
                                    <CarCard
                                        key={carId || i}
                                        car={car}
                                        index={i}
                                        usdToSar={usdToSar}
                                        isSelected={selectedIds.includes(carId)}
                                        onToggleSelect={handleToggleSelect}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onMarkSold={handleMarkSold}
                                        onToggleActive={handleToggleActive}
                                    />
                                );
                            })}
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
