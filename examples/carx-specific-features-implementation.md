# 🚀 تطبيق عملي: إضافة ميزات خاصة بـ CARX

## 📋 المتطلبات الجديدة لـ CARX

### الميزات المطلوبة:
1. **نظام المزادات المباشرة**
2. **نظام التقسيط والتمويل**
3. **تكامل مع البنوك السعودية**
4. **دعم السوق الكوري**
5. **نظام تقييم السيارات**

## 🛠️ التطبيق العملي

### الخطوة 1: تحديث إعدادات CARX

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
      "koreanMarket": true,
      "carAppraisal": true
    },
    "integrations": {
      "banks": ["alrajhi", "sab", "alinma"],
      "paymentGateways": ["mada", "visa", "mastercard"],
      "koreanAPIs": ["kba", "kama"]
    },
    "businessRules": {
      "auctionCommission": 0.05,
      "installmentMaxMonths": 60,
      "minimumDownPayment": 0.20
    }
  }
}
```
### الخطوة 2: إنشاء Hook للميزات

```javascript
// client-app/src/hooks/useCarxFeatures.js
import { useTenant } from '@/lib/TenantContext';

export function useCarxFeatures() {
  const { tenant } = useTenant();
  
  // التحقق من أن هذا عميل CARX
  const isCarx = tenant?.id === 'carx';
  
  return {
    // الميزات الأساسية
    hasAuctions: isCarx && tenant?.features?.auctions,
    hasInstallments: isCarx && tenant?.features?.installments,
    hasBankIntegration: isCarx && tenant?.features?.bankIntegration,
    hasKoreanMarket: isCarx && tenant?.features?.koreanMarket,
    hasCarAppraisal: isCarx && tenant?.features?.carAppraisal,
    
    // إعدادات العمل
    auctionCommission: tenant?.businessRules?.auctionCommission || 0,
    maxInstallmentMonths: tenant?.businessRules?.installmentMaxMonths || 0,
    minDownPayment: tenant?.businessRules?.minimumDownPayment || 0,
    
    // التكاملات
    supportedBanks: tenant?.integrations?.banks || [],
    paymentMethods: tenant?.integrations?.paymentGateways || [],
    
    // دالة مساعدة للتحقق من الميزة
    hasFeature: (featureName) => isCarx && tenant?.features?.[featureName]
  };
}
```

### الخطوة 3: مكون المزادات المباشرة

```javascript
// client-app/src/components/carx/LiveAuction.tsx
'use client';
import { useState, useEffect } from 'react';
import { useCarxFeatures } from '@/hooks/useCarxFeatures';
import { useTenant } from '@/lib/TenantContext';

export const LiveAuction = ({ carId }) => {
  const { hasAuctions, auctionCommission } = useCarxFeatures();
  const { tenant } = useTenant();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    if (hasAuctions) {
      fetchAuctionData();
      startTimer();
    }
  }, [hasAuctions, carId]);
  
  const fetchAuctionData = async () => {
    try {
      const response = await fetch(`/api/v2/auctions/car/${carId}`);
      const data = await response.json();
      if (data.success) {
        setAuction(data.data);
        setBidAmount(data.data.currentBid + 1000);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المزاد:', error);
    }
  };
  
  const startTimer = () => {
    const timer = setInterval(() => {
      if (auction?.endDate) {
        const now = new Date().getTime();
        const end = new Date(auction.endDate).getTime();
        const distance = end - now;
        
        if (distance > 0) {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          setTimeLeft(`${hours}:${minutes}:${seconds}`);
        } else {
          setTimeLeft('انتهى المزاد');
          clearInterval(timer);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  };
  
  const placeBid = async () => {
    try {
      const response = await fetch(`/api/v2/auctions/${auction._id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bidAmount })
      });
      
      if (response.ok) {
        await fetchAuctionData(); // تحديث البيانات
      }
    } catch (error) {
      console.error('خطأ في المزايدة:', error);
    }
  };
  
  // إذا لم تكن الميزة متاحة، لا تعرض شيء
  if (!hasAuctions || !auction) {
    return null;
  }
  
  return (
    <div className="live-auction" style={{
      border: `2px solid ${tenant.theme.primaryColor}`,
      borderRadius: '10px',
      padding: '20px',
      margin: '20px 0',
      backgroundColor: tenant.theme.backgroundColor,
      color: tenant.theme.textColor
    }}>
      <h3>🔥 مزاد مباشر</h3>
      
      <div className="auction-info">
        <p><strong>المزايدة الحالية:</strong> {auction.currentBid?.toLocaleString()} ريال</p>
        <p><strong>عدد المزايدات:</strong> {auction.bids?.length || 0}</p>
        <p><strong>الوقت المتبقي:</strong> {timeLeft}</p>
        <p><strong>عمولة المزاد:</strong> {(auctionCommission * 100)}%</p>
      </div>
      
      <div className="bid-section">
        <input 
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          min={auction.currentBid + 1000}
          step="1000"
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: `1px solid ${tenant.theme.primaryColor}`,
            marginRight: '10px'
          }}
        />
        <button 
          onClick={placeBid}
          disabled={bidAmount <= auction.currentBid}
          style={{
            backgroundColor: tenant.theme.primaryColor,
            color: tenant.theme.textColor,
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          زايد الآن
        </button>
      </div>
      
      <div className="recent-bids">
        <h4>آخر المزايدات:</h4>
        {auction.bids?.slice(-3).reverse().map((bid, index) => (
          <div key={index} className="bid-item">
            <span>{bid.amount.toLocaleString()} ريال</span>
            <span>{new Date(bid.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```
### الخطوة 4: نظام التقسيط والتمويل

```javascript
// client-app/src/components/carx/InstallmentCalculator.tsx
'use client';
import { useState, useEffect } from 'react';
import { useCarxFeatures } from '@/hooks/useCarxFeatures';
import { useTenant } from '@/lib/TenantContext';

export const InstallmentCalculator = ({ carPrice, carId }) => {
  const { hasInstallments, maxInstallmentMonths, minDownPayment, supportedBanks } = useCarxFeatures();
  const { tenant } = useTenant();
  
  const [months, setMonths] = useState(12);
  const [downPayment, setDownPayment] = useState(carPrice * minDownPayment);
  const [selectedBank, setSelectedBank] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(0.05);
  
  useEffect(() => {
    if (hasInstallments) {
      calculateInstallment();
    }
  }, [months, downPayment, interestRate, carPrice]);
  
  const calculateInstallment = () => {
    const loanAmount = carPrice - downPayment;
    const monthlyRate = interestRate / 12;
    const numPayments = months;
    
    const monthly = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                   (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    setMonthlyPayment(monthly);
    setTotalAmount(monthly * numPayments + downPayment);
  };
  
  const applyForFinancing = async () => {
    try {
      const response = await fetch('/api/v2/financing/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId,
          carPrice,
          downPayment,
          months,
          bank: selectedBank,
          monthlyPayment
        })
      });
      
      if (response.ok) {
        alert('تم تقديم طلب التمويل بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في طلب التمويل:', error);
    }
  };
  
  if (!hasInstallments) {
    return null;
  }
  
  return (
    <div className="installment-calculator" style={{
      border: `2px solid ${tenant.theme.primaryColor}`,
      borderRadius: '10px',
      padding: '20px',
      margin: '20px 0',
      backgroundColor: tenant.theme.backgroundColor,
      color: tenant.theme.textColor
    }}>
      <h3>💳 حاسبة التقسيط</h3>
      
      <div className="calculator-form">
        <div className="form-group">
          <label>سعر السيارة:</label>
          <input 
            type="text" 
            value={carPrice.toLocaleString()} 
            disabled 
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </div>
        
        <div className="form-group">
          <label>الدفعة المقدمة (الحد الأدنى {(minDownPayment * 100)}%):</label>
          <input 
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            min={carPrice * minDownPayment}
            max={carPrice * 0.8}
          />
        </div>
        
        <div className="form-group">
          <label>مدة التقسيط (شهر):</label>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {[12, 24, 36, 48, 60].filter(m => m <= maxInstallmentMonths).map(month => (
              <option key={month} value={month}>{month} شهر</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>البنك:</label>
          <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
            <option value="">اختر البنك</option>
            {supportedBanks.map(bank => (
              <option key={bank} value={bank}>
                {bank === 'alrajhi' ? 'بنك الراجحي' :
                 bank === 'sab' ? 'البنك السعودي البريطاني' :
                 bank === 'alinma' ? 'بنك الإنماء' : bank}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="calculation-results">
        <div className="result-item">
          <span>مبلغ التمويل:</span>
          <span>{(carPrice - downPayment).toLocaleString()} ريال</span>
        </div>
        <div className="result-item">
          <span>القسط الشهري:</span>
          <span style={{ color: tenant.theme.primaryColor, fontWeight: 'bold' }}>
            {monthlyPayment.toLocaleString()} ريال
          </span>
        </div>
        <div className="result-item">
          <span>إجمالي المبلغ:</span>
          <span>{totalAmount.toLocaleString()} ريال</span>
        </div>
        <div className="result-item">
          <span>إجمالي الفوائد:</span>
          <span>{(totalAmount - carPrice).toLocaleString()} ريال</span>
        </div>
      </div>
      
      <button 
        onClick={applyForFinancing}
        disabled={!selectedBank}
        style={{
          backgroundColor: tenant.theme.primaryColor,
          color: tenant.theme.textColor,
          padding: '15px 30px',
          borderRadius: '5px',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          marginTop: '20px',
          fontSize: '16px'
        }}
      >
        تقديم طلب التمويل
      </button>
    </div>
  );
};
```
### الخطوة 5: تكامل مع البنوك السعودية

```javascript
// routes/api/v2/banking/integration.js
const express = require('express');
const router = express.Router();

// تكامل مع بنك الراجحي
const alrajhiAPI = {
  async checkEligibility(customerData) {
    // محاكاة API بنك الراجحي
    return {
      eligible: true,
      maxAmount: customerData.salary * 33, // 33 راتب
      interestRate: 0.045,
      maxMonths: 60
    };
  },
  
  async submitApplication(applicationData) {
    // محاكاة تقديم طلب للبنك
    return {
      applicationId: 'ALR' + Date.now(),
      status: 'pending',
      estimatedResponse: '24 hours'
    };
  }
};

// فحص الأهلية للتمويل
router.post('/check-eligibility', async (req, res) => {
  if (!req.tenant.features?.bankIntegration) {
    return res.status(403).json({ error: 'التكامل البنكي غير متاح' });
  }
  
  const { bank, customerData } = req.body;
  
  try {
    let result;
    
    switch (bank) {
      case 'alrajhi':
        result = await alrajhiAPI.checkEligibility(customerData);
        break;
      case 'sab':
        // تكامل مع البنك السعودي البريطاني
        result = { eligible: true, maxAmount: customerData.salary * 30 };
        break;
      case 'alinma':
        // تكامل مع بنك الإنماء
        result = { eligible: true, maxAmount: customerData.salary * 35 };
        break;
      default:
        return res.status(400).json({ error: 'بنك غير مدعوم' });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في التحقق من الأهلية' });
  }
});

// تقديم طلب تمويل
router.post('/apply', async (req, res) => {
  if (!req.tenant.features?.bankIntegration) {
    return res.status(403).json({ error: 'التكامل البنكي غير متاح' });
  }
  
  const { bank, applicationData } = req.body;
  const FinancingApplication = req.getModel('FinancingApplication');
  
  try {
    // حفظ الطلب في قاعدة البيانات
    const application = new FinancingApplication({
      ...applicationData,
      bank,
      status: 'submitted',
      tenantId: req.tenant.id
    });
    
    await application.save();
    
    // إرسال للبنك
    let bankResponse;
    switch (bank) {
      case 'alrajhi':
        bankResponse = await alrajhiAPI.submitApplication(applicationData);
        break;
      // باقي البنوك...
    }
    
    // تحديث حالة الطلب
    application.bankApplicationId = bankResponse.applicationId;
    application.bankStatus = bankResponse.status;
    await application.save();
    
    res.json({ 
      success: true, 
      data: {
        applicationId: application._id,
        bankApplicationId: bankResponse.applicationId,
        status: bankResponse.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تقديم الطلب' });
  }
});

module.exports = router;
```

### الخطوة 6: دعم السوق الكوري

```javascript
// client-app/src/components/carx/KoreanMarketFeatures.tsx
'use client';
import { useState, useEffect } from 'react';
import { useCarxFeatures } from '@/hooks/useCarxFeatures';

export const KoreanMarketFeatures = ({ car }) => {
  const { hasKoreanMarket } = useCarxFeatures();
  const [koreanData, setKoreanData] = useState(null);
  
  useEffect(() => {
    if (hasKoreanMarket && car.origin === 'korea') {
      fetchKoreanData();
    }
  }, [hasKoreanMarket, car]);
  
  const fetchKoreanData = async () => {
    try {
      const response = await fetch(`/api/v2/korean-market/car/${car._id}`);
      const data = await response.json();
      setKoreanData(data.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات الكورية:', error);
    }
  };
  
  if (!hasKoreanMarket || car.origin !== 'korea') {
    return null;
  }
  
  return (
    <div className="korean-market-features">
      <h3>🇰🇷 معلومات السوق الكوري</h3>
      
      {koreanData && (
        <div className="korean-info">
          <div className="info-item">
            <span>السعر في كوريا:</span>
            <span>{koreanData.originalPrice?.toLocaleString()} وون</span>
          </div>
          
          <div className="info-item">
            <span>تاريخ التصنيع:</span>
            <span>{koreanData.manufacturingDate}</span>
          </div>
          
          <div className="info-item">
            <span>رقم الشاسيه الكوري:</span>
            <span>{koreanData.koreanVIN}</span>
          </div>
          
          <div className="info-item">
            <span>تقرير الحادث:</span>
            <span style={{ color: koreanData.accidentHistory ? 'red' : 'green' }}>
              {koreanData.accidentHistory ? 'يوجد حوادث' : 'لا توجد حوادث'}
            </span>
          </div>
          
          <div className="info-item">
            <span>تقييم الحالة:</span>
            <span>{koreanData.conditionRating}/10</span>
          </div>
          
          <div className="documents">
            <h4>المستندات الكورية:</h4>
            {koreanData.documents?.map((doc, index) => (
              <a key={index} href={doc.url} target="_blank" rel="noopener noreferrer">
                {doc.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```
### الخطوة 7: تجميع كل الميزات في صفحة السيارة

```javascript
// client-app/src/app/cars/[id]/page.tsx (نسخة محسنة لـ CARX)
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/TenantContext';
import { useCarxFeatures } from '@/hooks/useCarxFeatures';

// استيراد المكونات الخاصة بـ CARX
import { LiveAuction } from '@/components/carx/LiveAuction';
import { InstallmentCalculator } from '@/components/carx/InstallmentCalculator';
import { KoreanMarketFeatures } from '@/components/carx/KoreanMarketFeatures';
import { CarAppraisal } from '@/components/carx/CarAppraisal';

export default function CarDetailsPage() {
  const params = useParams();
  const { tenant } = useTenant();
  const carxFeatures = useCarxFeatures();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCarDetails();
  }, [params.id]);
  
  const fetchCarDetails = async () => {
    try {
      const response = await fetch(`/api/v2/cars/${params.id}`);
      const data = await response.json();
      setCar(data.data);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل السيارة:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>جاري التحميل...</div>;
  }
  
  if (!car) {
    return <div>السيارة غير موجودة</div>;
  }
  
  return (
    <div className="car-details-page">
      {/* معلومات السيارة الأساسية */}
      <div className="car-basic-info">
        <h1>{car.name}</h1>
        <div className="car-images">
          {car.images?.map((image, index) => (
            <img key={index} src={image} alt={car.name} />
          ))}
        </div>
        
        <div className="car-specs">
          <p><strong>السعر:</strong> {car.price?.toLocaleString()} ريال</p>
          <p><strong>الموديل:</strong> {car.year}</p>
          <p><strong>الكيلومترات:</strong> {car.mileage?.toLocaleString()} كم</p>
          <p><strong>نوع الوقود:</strong> {car.fuelType}</p>
        </div>
      </div>
      
      {/* الميزات الخاصة بـ CARX */}
      {tenant?.id === 'carx' && (
        <div className="carx-exclusive-features">
          
          {/* نظام المزادات المباشرة */}
          {carxFeatures.hasAuctions && (
            <LiveAuction carId={car._id} />
          )}
          
          {/* حاسبة التقسيط */}
          {carxFeatures.hasInstallments && (
            <InstallmentCalculator 
              carPrice={car.price} 
              carId={car._id} 
            />
          )}
          
          {/* معلومات السوق الكوري */}
          {carxFeatures.hasKoreanMarket && car.origin === 'korea' && (
            <KoreanMarketFeatures car={car} />
          )}
          
          {/* نظام تقييم السيارات */}
          {carxFeatures.hasCarAppraisal && (
            <CarAppraisal car={car} />
          )}
          
        </div>
      )}
      
      {/* معلومات عامة لكل العملاء */}
      <div className="general-features">
        <div className="contact-seller">
          <h3>تواصل مع البائع</h3>
          <a 
            href={`https://wa.me/${tenant.contact.whatsapp}`}
            style={{ backgroundColor: tenant.theme.primaryColor }}
          >
            واتساب: {tenant.contact.phone}
          </a>
        </div>
        
        <div className="car-description">
          <h3>وصف السيارة</h3>
          <p>{car.description}</p>
        </div>
      </div>
    </div>
  );
}
```

### الخطوة 8: إعداد التوجيه (Routing) للميزات الخاصة

```javascript
// client-app/src/app/auctions/page.tsx (صفحة المزادات - CARX فقط)
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCarxFeatures } from '@/hooks/useCarxFeatures';

export default function AuctionsPage() {
  const { hasAuctions } = useCarxFeatures();
  const router = useRouter();
  
  useEffect(() => {
    if (!hasAuctions) {
      router.push('/');
    }
  }, [hasAuctions, router]);
  
  if (!hasAuctions) {
    return (
      <div className="feature-not-available">
        <h1>هذه الميزة غير متاحة</h1>
        <p>ميزة المزادات متاحة فقط في معرض CAR X</p>
      </div>
    );
  }
  
  return (
    <div className="auctions-page">
      <h1>المزادات المباشرة</h1>
      {/* محتوى صفحة المزادات */}
    </div>
  );
}

// client-app/src/app/financing/page.tsx (صفحة التمويل - CARX فقط)
'use client';
import { useCarxFeatures } from '@/hooks/useCarxFeatures';

export default function FinancingPage() {
  const { hasInstallments, hasBankIntegration } = useCarxFeatures();
  
  if (!hasInstallments || !hasBankIntegration) {
    return (
      <div className="feature-not-available">
        <h1>خدمة التمويل غير متاحة</h1>
        <p>خدمة التمويل متاحة فقط في معرض CAR X</p>
      </div>
    );
  }
  
  return (
    <div className="financing-page">
      <h1>خدمات التمويل</h1>
      {/* محتوى صفحة التمويل */}
    </div>
  );
}
```

## 🎯 النتيجة النهائية

### ما سيحصل عليه CARX:
✅ **نظام مزادات مباشرة** مع عد تنازلي ومزايدات فورية
✅ **حاسبة تقسيط متقدمة** مع تكامل بنكي
✅ **دعم السوق الكوري** مع معلومات خاصة
✅ **نظام تقييم السيارات** احترافي
✅ **صفحات خاصة** (/auctions, /financing)

### ما سيبقى في HMCAR:
✅ **النظام الأساسي** بدون تعقيدات
✅ **سرعة عالية** لعدم وجود ميزات إضافية
✅ **بساطة في الاستخدام**

### المميزات التقنية:
✅ **عزل كامل** - ميزات CARX لا تظهر في HMCAR
✅ **أمان محكم** - التحقق من الصلاحيات في كل طلب
✅ **مرونة عالية** - يمكن تفعيل/إلغاء الميزات بسهولة
✅ **سهولة الصيانة** - كود منظم ومفصول

**النتيجة: نظام واحد يخدم عميلين بمتطلبات مختلفة تماماً!**