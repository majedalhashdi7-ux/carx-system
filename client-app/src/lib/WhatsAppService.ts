// [[ARABIC_HEADER]] هذا الملف (client-app/src/lib/WhatsAppService.ts) جزء من مشروع HM CAR ويقوم بتوليد روابط واتساب احترافية.

/**
 * WhatsAppService - خدمة توليد روابط التواصل
 * تساعد في تحويل الزوار إلى عملاء حقيقيين عبر رسائل مجهزة مسبقاً.
 */

export const WhatsAppService = {
    /**
     * توليد رابط واتساب لسيارة محددة من المعرض الكوري أو المحلي
     */
    generateCarLink: (car: Record<string, unknown>, phoneNumber: string, isRTL: boolean, formatPrice?: (p: number) => string) => {
        if (!car) return '';
        
        const carTitle = car.title || car.model || 'سيارة من المعرض';
        const carMake = typeof car.make === 'object' ? (car.make as Record<string, unknown>)?.name : car.make;
        const price = formatPrice ? formatPrice(Number(car.price || 0)) : `${Number(car.price || 0).toLocaleString()} SAR`;
        
        // رابط السيارة المباشر
        const localId = car._id || car.id || '';
        const host = typeof window !== 'undefined' ? window.location.origin : '';
        const localLink = localId ? `${host}/cars/${localId}` : '';
        const carLink = car.externalUrl || car.encarUrl || localLink || '';

        // صورة السيارة
        const imagesList = Array.isArray(car.images) ? car.images : [];
        const carImage = imagesList[0] || car.imageUrl || '';

        const msg = isRTL
            ? `السلام عليكم HM CAR،\n\nأرغب في شراء هذه السيارة:\n🚗 *${carTitle}*\n🛠️ الماركة: ${carMake}\n📅 الموديل: ${car.year || 'غير حدد'}\n🛣️ الممشى: ${car.mileage?.toLocaleString() || '0'} كم\n💰 السعر: ${price}\n🔗 الرابط: ${carLink}${carImage ? `\n🖼️ الصورة: ${carImage}` : ''}\n\nأرجو تزويدي بمزيد من التفاصيل لإتمام عملية الشراء.`
            : `Hello HM CAR,\n\nI'm interested in buying this vehicle:\n🚗 *${carTitle}*\n🛠️ Make: ${carMake}\n📅 Year: ${car.year || 'N/A'}\n🛣️ Mileage: ${car.mileage?.toLocaleString() || '0'} km\n💰 Price: ${price}\n🔗 Link: ${carLink}${carImage ? `\n🖼️ Image: ${carImage}` : ''}\n\nPlease provide more details to complete the purchase.`;

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    },

    /**
     * توليد رابط واتساب لمزاد محدد
     */
    generateAuctionLink: (auction: Record<string, unknown>, phoneNumber: string, isRTL: boolean, formatPrice?: (p: number) => string) => {
        if (!auction) return '';
        
        const auctionCar = auction.car as Record<string, unknown> | undefined;
        const title = auction.title || (auctionCar ? `${auctionCar.make} ${auctionCar.model}` : 'مزاد سيارة');
        const price = formatPrice ? formatPrice(Number(auction.currentPrice || auction.startingPrice || 0)) : `${Number(auction.currentPrice || 0).toLocaleString()} SAR`;

        const msg = isRTL
            ? `السلام عليكم HM CAR،\n\nبخصوص المزاد القائم على:\n🔨 *${title}*\n💰 السعر الحالي: ${price}\n\nأرغب في الاستفسار عن تفاصيل المزايدة.`
            : `Hello HM CAR,\n\nRegarding the active auction for:\n🔨 *${title}*\n💰 Current Price: ${price}\n\nI have a question about the bidding process.`;

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    },

    /**
     * رابط عام لخدمة العملاء
     */
    getSupportLink: (phoneNumber: string, isRTL: boolean) => {
        const msg = isRTL 
            ? 'السلام عليكم، أحتاج إلى مساعدة بخصوص خدمات HM CAR.'
            : 'Hello, I need assistance regarding HM CAR services.';
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    }
};
