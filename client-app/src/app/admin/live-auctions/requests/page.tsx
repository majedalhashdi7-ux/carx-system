'use client';

import { useState, useEffect } from "react";
import { api } from "@/lib/api-original";
import { useLanguage } from "@/lib/LanguageContext";

export default function LiveAuctionRequests() {
    const { isRTL } = useLanguage();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        try {
            const res = await api.liveAuctionRequests.list();
            if (res?.success) setRequests(res.data);
        } catch (error) {
            console.error('Failed to load requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            rejected: "bg-red-500/10 text-red-500 border-red-500/20",
            won: "bg-green-500/10 text-green-500 border-green-500/20",
            lost: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
        };
        const labels: Record<string, string> = {
            pending: isRTL ? "قيد المراجعة" : "Pending",
            approved: isRTL ? "موافق عليه" : "Approved",
            rejected: isRTL ? "تم الرفض" : "Rejected",
            won: isRTL ? "تم الشراء (פُزنا)" : "Won",
            lost: isRTL ? "خسرنا المزاد" : "Lost",
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        let agreedMaxPrice = undefined;
        let finalPurchasePrice = undefined;

        if (newStatus === 'approved') {
            const price = prompt(isRTL ? "أدخل السعر الأقصى المتفق عليه للمزايدة:" : "Enter agreed maximum bid price:");
            if (price === null) return;
            agreedMaxPrice = Number(price);
        } else if (newStatus === 'won') {
            const price = prompt(isRTL ? "ألف مبروك! ما هو السعر النهائي الذي تم الشراء به؟ (سيصدر به فاتورة):" : "Final winning price? (Invoice will be generated):");
            if (price === null) return;
            finalPurchasePrice = Number(price);
        }

        try {
            const res = await api.liveAuctionRequests.updateStatus(id, { 
                status: newStatus, 
                agreedMaxPrice: agreedMaxPrice || undefined, 
                finalPurchasePrice: finalPurchasePrice || undefined 
            });
            if (res.success) {
                alert(isRTL ? 'تم تحديث حالة الطلب بنجاح' : 'Status updated successfully');
                loadRequests();
            }
        } catch {
            alert('Failed to update status');
        }
    };

    return (
        <div className={`min-h-screen bg-[#050505] text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="w-full">
                        <h1 className="text-xl md:text-3xl font-black uppercase text-cinematic-neon-blue break-words">
                            {isRTL ? "طلبات المزايدة المباشرة (الوكالة)" : "Live Proxy Bidding Requests"}
                        </h1>
                        <p className="text-white/40 mt-2">{isRTL ? "إدارة الطلبات التي تصلك أثناء البث المباشر" : "Manage requests coming in during live streams"}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-white/40">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.length === 0 && <div className="col-span-full text-center py-20 text-white/40">لا توجد طلبات مزايدة حالياً.</div>}
                        {requests.map(req => (
                            <div key={req._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <StatusBadge status={req.status} />
                                        <div className="text-[10px] text-white/30">{new Date(req.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                    <h3 className="text-lg font-black uppercase mb-1">{req.car.title}</h3>
                                    <div className="text-sm text-cinematic-neon-blue mb-4">Lot: {req.car.lotNumber || 'N/A'} - {req.sessionTitle || req.session?.title}</div>
                                    
                                    <div className="bg-black/30 p-4 rounded-xl space-y-2 text-sm">
                                        <p><span className="text-white/40">العميل:</span> {req.guestName}</p>
                                        <p><span className="text-white/40">الهاتف:</span> {req.guestPhone}</p>
                                    </div>

                                    {(req.agreedMaxPrice > 0 || req.finalPurchasePrice > 0) && (
                                        <div className="mt-4 space-y-1 bg-cinematic-neon-blue/10 p-3 rounded-lg border border-cinematic-neon-blue/20">
                                            {req.agreedMaxPrice > 0 && <p className="text-xs"><span className="text-white/40">الحد الأقصى للمزايدة:</span> <strong className="text-cinematic-neon-blue">{req.agreedMaxPrice}</strong></p>}
                                            {req.finalPurchasePrice > 0 && <p className="text-xs"><span className="text-white/40">تم الشراء بسعر:</span> <strong className="text-green-400">{req.finalPurchasePrice}</strong></p>}
                                        </div>
                                    )}

                                    {/* Invoice Link if generated */}
                                    {req.invoice && (
                                        <div className="mt-4 flex gap-4">
                                            <a href={`/admin/invoices/${typeof req.invoice === 'object' ? req.invoice._id : req.invoice}/edit`} target="_blank" className="text-xs text-yellow-500 underline hover:text-white transition">إكمال/تعديل الفاتورة</a>
                                            <a href={`/admin/invoices/${typeof req.invoice === 'object' ? req.invoice._id : req.invoice}`} target="_blank" className="text-xs text-cinematic-neon-red underline hover:text-white transition">طباعة الفاتورة الناتجة</a>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                                    {req.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(req._id, 'approved')} className="py-2 bg-blue-500/20 text-blue-500 rounded-lg text-xs font-bold hover:bg-blue-500 hover:text-white transition">موافقة وتحديد السعر</button>
                                            <button onClick={() => handleUpdateStatus(req._id, 'rejected')} className="py-2 bg-red-500/20 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition">رفض</button>
                                        </>
                                    )}
                                    {req.status === 'approved' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(req._id, 'won')} className="py-2 bg-green-500/20 text-green-500 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white transition">فُزنا (إصدار فاتورة)</button>
                                            <button onClick={() => handleUpdateStatus(req._id, 'lost')} className="py-2 bg-zinc-500/20 text-zinc-500 rounded-lg text-xs font-bold hover:bg-zinc-500 hover:text-white transition">خسرنا</button>
                                        </>
                                    )}
                                    {(req.status === 'won' || req.status === 'lost' || req.status === 'rejected') && (
                                        <div className="col-span-2 text-center text-xs text-white/20">لا يمكن تغيير الحالة بعد الحسم</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
