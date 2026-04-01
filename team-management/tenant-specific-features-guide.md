# 🎯 دليل إضافة ميزات خاصة بعميل واحد

## 📋 المشكلة

**CARX يحتاج ميزات إضافية غير موجودة في HMCAR:**
- نظام مزادات متقدم
- نظام تقسيط
- تكامل مع بنوك
- ميزات خاصة بالسوق الكوري

## 🎯 الحلول المختلفة

### الحل الأول: Feature Flags (الأفضل)
```javascript
// في tenants.json
{
  "carx": {
    "features": {
      "auctions": true,
      "installments": true,
      "bankIntegration": true,
      "koreanMarket": true
    }
  },
  "hmcar": {
    "features": {
      "auctions": false,
      "installments": false,
      "bankIntegration": false,
      "koreanMarket": false
    }
  }
}
```
### استخدام Feature Flags في الكود:

#### Frontend (React):
```javascript
// client-app/src/hooks/useFeatures.js
import { useTenant } from '@/lib/TenantContext';

export function useFeatures() {
  const { tenant } = useTenant();
  
  return {
    hasAuctions: tenant?.features?.auctions || false,
    hasInstallments: tenant?.features?.installments || false,
    hasBankIntegration: tenant?.features?.bankIntegration || false,
    hasKoreanMarket: tenant?.features?.koreanMarket || false
  };
}

// استخدام في المكونات
const CarCard = ({ car }) => {
  const { hasAuctions, hasInstallments } = useFeatures();
  
  return (
    <div className="car-card">
      <h3>{car.name}</h3>
      <p>{car.price}</p>
      
      {hasAuctions && (
        <button>شارك في المزاد</button>
      )}
      
      {hasInstallments && (
        <button>اشتري بالتقسيط</button>
      )}
    </div>
  );
};
```

#### Backend (Express):
```javascript
// routes/api/v2/cars.js
router.get('/cars/:id', async (req, res) => {
  const Car = req.getModel('Car');
  const car = await Car.findById(req.params.id);
  
  // إضافة معلومات حسب ميزات العميل
  const response = {
    ...car.toObject(),
    features: {}
  };
  
  // ميزة المزادات (CARX فقط)
  if (req.tenant.features?.auctions) {
    const Auction = req.getModel('Auction');
    response.features.auction = await Auction.findOne({ carId: car._id });
  }
  
  // ميزة التقسيط (CARX فقط)
  if (req.tenant.features?.installments) {
    response.features.installmentPlans = [
      { months: 12, monthlyPayment: car.price / 12 },
      { months: 24, monthlyPayment: car.price / 24 },
      { months: 36, monthlyPayment: car.price / 36 }
    ];
  }
  
  res.json({ success: true, data: response });
});
```
### الحل الثاني: Tenant-Specific Components

#### إنشاء مكونات خاصة بـ CARX:
```javascript
// client-app/src/components/carx/AuctionWidget.tsx
export const AuctionWidget = ({ car }) => {
  const [currentBid, setCurrentBid] = useState(car.startingBid);
  
  return (
    <div className="auction-widget">
      <h4>مزاد السيارة</h4>
      <p>المزايدة الحالية: {currentBid} ريال</p>
      <button onClick={() => placeBid()}>
        زايد الآن
      </button>
    </div>
  );
};

// client-app/src/components/carx/InstallmentCalculator.tsx
export const InstallmentCalculator = ({ carPrice }) => {
  const [months, setMonths] = useState(12);
  
  return (
    <div className="installment-calculator">
      <h4>حاسبة التقسيط</h4>
      <select value={months} onChange={(e) => setMonths(e.target.value)}>
        <option value={12}>12 شهر</option>
        <option value={24}>24 شهر</option>
        <option value={36}>36 شهر</option>
      </select>
      <p>القسط الشهري: {carPrice / months} ريال</p>
    </div>
  );
};

// استخدام المكونات الخاصة
const CarDetailsPage = ({ car }) => {
  const { tenant } = useTenant();
  
  return (
    <div>
      <h1>{car.name}</h1>
      <p>{car.description}</p>
      
      {/* مكونات خاصة بـ CARX */}
      {tenant.id === 'carx' && (
        <>
          <AuctionWidget car={car} />
          <InstallmentCalculator carPrice={car.price} />
        </>
      )}
    </div>
  );
};
```
### الحل الثالث: Tenant-Specific Routes

#### إضافة صفحات خاصة بـ CARX:
```javascript
// client-app/src/app/auctions/page.tsx (صفحة المزادات - CARX فقط)
'use client';
import { useTenant } from '@/lib/TenantContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuctionsPage() {
  const { tenant } = useTenant();
  const router = useRouter();
  
  // إعادة توجيه إذا لم تكن الميزة متاحة
  useEffect(() => {
    if (!tenant?.features?.auctions) {
      router.push('/');
    }
  }, [tenant]);
  
  if (!tenant?.features?.auctions) {
    return <div>هذه الصفحة غير متاحة</div>;
  }
  
  return (
    <div>
      <h1>المزادات الحية</h1>
      {/* محتوى صفحة المزادات */}
    </div>
  );
}

// routes/api/v2/auctions.js (API خاص بالمزادات)
router.get('/auctions', (req, res) => {
  // التحقق من أن العميل يدعم المزادات
  if (!req.tenant.features?.auctions) {
    return res.status(403).json({ 
      error: 'ميزة المزادات غير متاحة لهذا المعرض' 
    });
  }
  
  // منطق المزادات
  const Auction = req.getModel('Auction');
  // ... باقي الكود
});
```
## 🛠️ تطبيق عملي: إضافة نظام المزادات لـ CARX

### الخطوة 1: تحديث إعدادات العميل
```json
// tenants/tenants.json
{
  "carx": {
    "id": "carx",
    "name": "CAR X",
    "features": {
      "auctions": true,
      "installments": true,
      "bankIntegration": true,
      "koreanMarket": true
    },
    "auctionSettings": {
      "minimumBidIncrement": 1000,
      "auctionDuration": 7,
      "commissionRate": 0.05
    }
  },
  "hmcar": {
    "id": "hmcar", 
    "name": "HM CAR",
    "features": {
      "auctions": false,
      "installments": false,
      "bankIntegration": false,
      "koreanMarket": false
    }
  }
}
```

### الخطوة 2: إنشاء نموذج المزاد (Backend)
```javascript
// models/Auction.js
const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  startingBid: { type: Number, required: true },
  currentBid: { type: Number, default: 0 },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'ended'], 
    default: 'upcoming' 
  },
  bids: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Auction', auctionSchema);
```
### الخطوة 3: إنشاء APIs للمزادات
```javascript
// routes/api/v2/auctions.js
const express = require('express');
const router = express.Router();

// جلب المزادات النشطة
router.get('/', async (req, res) => {
  if (!req.tenant.features?.auctions) {
    return res.status(403).json({ error: 'المزادات غير متاحة' });
  }
  
  const Auction = req.getModel('Auction');
  const auctions = await Auction.find({ status: 'active' })
    .populate('carId')
    .populate('highestBidder', 'name');
    
  res.json({ success: true, data: auctions });
});

// إنشاء مزاد جديد
router.post('/', async (req, res) => {
  if (!req.tenant.features?.auctions) {
    return res.status(403).json({ error: 'المزادات غير متاحة' });
  }
  
  const { carId, startingBid, duration } = req.body;
  const Auction = req.getModel('Auction');
  
  const auction = new Auction({
    carId,
    startingBid,
    currentBid: startingBid,
    startDate: new Date(),
    endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
  });
  
  await auction.save();
  res.json({ success: true, data: auction });
});

// المزايدة
router.post('/:id/bid', async (req, res) => {
  if (!req.tenant.features?.auctions) {
    return res.status(403).json({ error: 'المزادات غير متاحة' });
  }
  
  const { amount } = req.body;
  const Auction = req.getModel('Auction');
  
  const auction = await Auction.findById(req.params.id);
  
  if (amount <= auction.currentBid) {
    return res.status(400).json({ error: 'المبلغ يجب أن يكون أعلى من المزايدة الحالية' });
  }
  
  auction.currentBid = amount;
  auction.highestBidder = req.user.id;
  auction.bids.push({
    userId: req.user.id,
    amount: amount
  });
  
  await auction.save();
  res.json({ success: true, data: auction });
});

module.exports = router;
```
### الخطوة 4: إنشاء واجهة المزادات (Frontend)
```javascript
// client-app/src/components/carx/AuctionCard.tsx
import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';

export const AuctionCard = ({ auction }) => {
  const { tenant } = useTenant();
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState(auction.currentBid + 1000);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.endDate).getTime();
      const distance = end - now;
      
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`${days}د ${hours}س ${minutes}ق`);
      } else {
        setTimeLeft('انتهى المزاد');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [auction.endDate]);
  
  const placeBid = async () => {
    try {
      const response = await fetch(`/api/v2/auctions/${auction._id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bidAmount })
      });
      
      if (response.ok) {
        // تحديث البيانات
        window.location.reload();
      }
    } catch (error) {
      console.error('خطأ في المزايدة:', error);
    }
  };
  
  return (
    <div className="auction-card" style={{ 
      borderColor: tenant.theme.primaryColor,
      backgroundColor: tenant.theme.backgroundColor 
    }}>
      <img src={auction.carId.images[0]} alt={auction.carId.name} />
      <h3>{auction.carId.name}</h3>
      <p>المزايدة الحالية: {auction.currentBid.toLocaleString()} ريال</p>
      <p>الوقت المتبقي: {timeLeft}</p>
      
      <div className="bid-section">
        <input 
          type="number" 
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          min={auction.currentBid + 1000}
        />
        <button 
          onClick={placeBid}
          style={{ backgroundColor: tenant.theme.primaryColor }}
        >
          زايد الآن
        </button>
      </div>
    </div>
  );
};

// client-app/src/app/auctions/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { AuctionCard } from '@/components/carx/AuctionCard';

export default function AuctionsPage() {
  const { tenant } = useTenant();
  const [auctions, setAuctions] = useState([]);
  
  useEffect(() => {
    if (tenant?.features?.auctions) {
      fetchAuctions();
    }
  }, [tenant]);
  
  const fetchAuctions = async () => {
    try {
      const response = await fetch('/api/v2/auctions');
      const data = await response.json();
      setAuctions(data.data);
    } catch (error) {
      console.error('خطأ في جلب المزادات:', error);
    }
  };
  
  if (!tenant?.features?.auctions) {
    return <div>هذه الصفحة غير متاحة في معرضكم</div>;
  }
  
  return (
    <div className="auctions-page">
      <h1>المزادات الحية</h1>
      <div className="auctions-grid">
        {auctions.map(auction => (
          <AuctionCard key={auction._id} auction={auction} />
        ))}
      </div>
    </div>
  );
}
```
## 🎯 إدارة الفريق للميزات الخاصة

### تقسيم المهام:

#### المبرمج الأول (Frontend):
```bash
المهام:
1. إنشاء مكونات المزادات (AuctionCard, AuctionWidget)
2. صفحة المزادات (/auctions)
3. إضافة أزرار المزادات في صفحات السيارات
4. اختبار على CARX فقط (يجب ألا تظهر في HMCAR)

الاختبار:
- carx-motors.com/auctions ← يجب أن تعمل
- hmcar.xyz/auctions ← يجب أن تعيد "غير متاحة"
```

#### المبرمج الثاني (Backend):
```bash
المهام:
1. إنشاء نموذج Auction
2. APIs المزادات (إنشاء، جلب، مزايدة)
3. نظام الإشعارات للمزايدات
4. التحقق من الصلاحيات (CARX فقط)

الاختبار:
- curl -H "X-Tenant-ID: carx" GET /api/v2/auctions ← يجب أن تعمل
- curl -H "X-Tenant-ID: hmcar" GET /api/v2/auctions ← يجب أن ترفض
```

#### أنت (Integration):
```bash
المهام:
1. ربط Frontend مع Backend
2. اختبار التكامل الكامل
3. التأكد من العزل بين العملاء
4. إعداد قاعدة البيانات للمزادات

الاختبار:
- تأكد أن مزادات CARX لا تظهر في HMCAR
- تأكد أن المزايدات تعمل بشكل صحيح
- اختبار الأداء تحت الضغط
```

### سير العمل اليومي:

#### اليوم الأول: التخطيط
```
9:00 - اجتماع الفريق (15 دقيقة)
- شرح متطلبات CARX الجديدة
- تقسيم المهام
- تحديد الجدول الزمني

9:15 - 12:00 - تصميم النظام
- رسم مخطط قاعدة البيانات
- تصميم واجهات المستخدم
- تحديد APIs المطلوبة

13:00 - 17:00 - البدء في التطوير
- إنشاء النماذج الأساسية
- إعداد البنية التحتية
```

#### اليوم الثاني: التطوير
```
9:00 - مراجعة التقدم
9:15 - 17:00 - تطوير مكثف
- Frontend: مكونات المزادات
- Backend: APIs المزادات
- Integration: ربط النظام
```

#### اليوم الثالث: الاختبار والنشر
```
9:00 - اختبار شامل
- اختبار الوظائف
- اختبار الأداء
- اختبار الأمان

14:00 - إصلاح المشاكل
16:00 - نشر النظام
17:00 - مراجعة نهائية
```

## 📊 مراقبة الميزات الخاصة

### تتبع الاستخدام:
```javascript
// إحصائيات خاصة بكل عميل
const tenantStats = {
  carx: {
    auctions: {
      total: 45,
      active: 12,
      completed: 33,
      totalBids: 234,
      revenue: 125000
    }
  },
  hmcar: {
    // لا توجد مزادات
  }
};
```

### تقارير الأداء:
```bash
# تقرير أسبوعي للميزات الخاصة
═══════════════════════════════════
📊 تقرير ميزات CARX - الأسبوع 12
═══════════════════════════════════

🏆 المزادات:
- مزادات جديدة: 8
- مزايدات: 156
- إيرادات: 45,000 ريال

💳 التقسيط:
- طلبات تقسيط: 23
- معدل الموافقة: 87%
- إيرادات: 78,000 ريال

🏦 التكامل البنكي:
- معاملات ناجحة: 45
- معاملات فاشلة: 2
- معدل النجاح: 95.7%
═══════════════════════════════════
```

## ✅ الخلاصة

### الطرق الثلاث لإضافة ميزات خاصة:

1. **Feature Flags** ← الأفضل للميزات البسيطة
2. **Tenant-Specific Components** ← للميزات المعقدة
3. **Tenant-Specific Routes** ← للصفحات الكاملة

### المميزات:
✅ **عزل كامل** - ميزات CARX لا تظهر في HMCAR
✅ **مرونة عالية** - يمكن تفعيل/إلغاء الميزات بسهولة
✅ **أمان محكم** - التحقق من الصلاحيات في كل طلب
✅ **سهولة الصيانة** - كود منظم ومفصول

### النتيجة:
- CARX يحصل على ميزات متقدمة (مزادات، تقسيط، تكامل بنكي)
- HMCAR يبقى بسيط وسريع
- نفس الفريق يدير النظامين
- إمكانية إضافة ميزات جديدة بسهولة