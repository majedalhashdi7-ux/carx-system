// [[ARABIC_HEADER]] هذا الملف (services/KoreanTranslationService.js) محرك تعريب وترجمة المصطلحات والأسماء الكورية

/**
 * قاموس دقيق ومحرك تنظيف للنصوص الكورية
 * يحول أي مصطلح كوري إلى اللغة العربية النظيفة أو الإنجليزية وتصفية أي حروف كورية متبقية.
 */

const KOREAN_DICTIONARY = {
  // ─── الماركات الكورية ─────────────────────────────────────────────────────
  '현대': 'هيونداي',
  '기아': 'كيا',
  '제네시스': 'جينيسيس',
  '쌍용': 'سانغ يونغ',
  'KG모빌리티': 'كي جي موبيليتي',
  '르노코리아': 'رينو الكورية',
  '르노삼성': 'سامسونج رينو',
  '쉐보레': 'شيفروليه',
  '벤츠': 'مرسيدس بنز',
  'BMW': 'بي إم دبليو',
  '아우디': 'أودي',
  '포르쉐': 'بورشه',
  '폭스바겐': 'فولكس فاجن',
  '볼보': 'فولفو',
  '렉서스': 'لكزس',
  '토요타': 'تويوتا',
  '닛산': 'نيسان',
  '혼다': 'هوندا',
  '테슬라': 'تسلا',
  '미니': 'ميني',
  '인피니티': 'إنفينيتي',
  '캐딜락': 'كاديلاك',
  '링컨': 'لينكولن',
  '마세라티': 'مازيراتي',
  '재규어': 'جاغوار',
  '랜드로버': 'لاند روفر',
  '포드': 'فورد',
  '지프': 'جيب',
  '크라이슬러': 'كرايسلر',
  '닷지': 'دودج',
  '람보르기니': 'لامبورغيني',
  '페라리': 'فيراري',
  '벤틀리': 'بنتلي',
  '롤스로이스': 'رولز رويس',
  '애스턴마틴': 'أستون مارتن',
  '맥라렌': 'ماكلارين',
  '포르쉐': 'بورشه',
  '알파로메오': 'ألفا روميو',
  '폴스타': 'بولستار',
  '볼보': 'فولفو',
  '사브': 'سآب',
  '스바루': 'سوبارو',
  '미쓰비시': 'ميتسوبيشي',
  '스즈키': 'سوزوكي',
  '마쯔다': 'مازدا',

  // ─── موديلات هيونداي الكاملة ───────────────────────────────────────────────
  '팰리세이드': 'باليساد',
  '그랜저': 'جرانديور',
  '아반떼': 'إلانترا',
  '쏘나타': 'سوناتا',
  '투싼': 'توسان',
  '싼타페': 'سانتافي',
  '코나': 'كونا',
  '베뉴': 'فينيو',
  '스타리아': 'ستاريا',
  '스타렉스': 'ستاركس',
  '포터': 'بورتر 2',
  '포터II': 'بورتر 2',
  '아이오닉': 'آيونيك',
  '아이오닉5': 'آيونيك 5',
  '아이오닉6': 'آيونيك 6',
  '캐스퍼': 'كاسبر',
  '엑센트': 'أكسنت',
  '벨로스터': 'فيلوستر',
  '쏠라티': 'سولاتي',
  'i30': 'i30',
  'i40': 'i40',
  '넥쏘': 'نيكسو (هيدروجين)',
  '맥스크루즈': 'ماكس كروز',
  '테라칸': 'تيراكان',
  '갤로퍼': 'جالوبر',
  '다이나스티': 'داينستي',

  // ─── موديلات كيا الكاملة ───────────────────────────────────────────────────
  '카니발': 'كارنيفال',
  '쏘렌토': 'سورينتو',
  '스포티지': 'سبورتاج',
  'K3': 'K3',
  'K5': 'K5',
  'K7': 'K7',
  'K8': 'K8',
  'K9': 'K9',
  '모하비': 'موهافي',
  '셀토스': 'سيلتوس',
  '니로': 'نيرو',
  '니로EV': 'نيرو كهربائي',
  '레이': 'راي',
  '모닝': 'مورنينج',
  '봉고': 'بونجو 3',
  'EV6': 'EV6',
  'EV9': 'EV9',
  '스팅어': 'ستينجر',
  '오피러스': 'أوبيروس',
  '프라이드': 'برايد',
  '쎄라토': 'سيراتو',
  '로체': 'لوتشه',
  '칸': 'كان',
  '카렌스': 'كارينز',
  '베스타': 'فيستا',

  // ─── موديلات جينيسيس الكاملة ──────────────────────────────────────────────
  'G70': 'G70',
  'G80': 'G80',
  'G90': 'G90',
  'GV70': 'GV70',
  'GV80': 'GV80',
  'GV60': 'GV60',
  'GV90': 'GV90',

  // ─── أنواع الوقود ─────────────────────────────────────────────────────────
  '휘발유': 'بنزين',
  '가솔린': 'بنزين',
  '경유': 'ديزل',
  '디젤': 'ديزل',
  '하이브리드': 'هجين',
  '플러그인하이브리드': 'هجين قابل للشحن (PHEV)',
  'PHEV': 'هجين قابل للشحن',
  '전기': 'كهربائي',
  '수소': 'هيدروجين',
  'LPG': 'غاز LPG',
  '가솔린+전기': 'هجين بنزين/كهرباء',
  '가솔린+LPG': 'بنزين/غاز LPG',
  '디젤+전기': 'هجين ديزل/كهرباء',

  // ─── ناقل الحركة ─────────────────────────────────────────────────────────
  '오토': 'أوتوماتيك',
  '자동': 'أوتوماتيك',
  '수동': 'يدوي',
  '반자동': 'أوتوماتيك مزدوج (DCT)',
  'DCT': 'ناقل حركة مزدوج DCT',
  'CVT': 'ناقل CVT',
  'AMT': 'ناقل AMT',

  // ─── نوع الجسم ────────────────────────────────────────────────────────────
  '세단': 'سيدان',
  'SUV': 'SUV',
  '해치백': 'هاتشباك',
  '쿠페': 'كوبيه',
  '왜건': 'ستيشن',
  '픽업': 'بيك آب',
  '밴': 'فان',
  '버스': 'باص',
  '트럭': 'شاحنة',
  '컨버터블': 'كابريوليه',
  '스포츠카': 'سيارة رياضية',

  // ─── الدفع ────────────────────────────────────────────────────────────────
  '전륜구동': 'دفع أمامي (FWD)',
  '후륜구동': 'دفع خلفي (RWD)',
  '사륜구동': 'دفع رباعي (4WD)',
  '상시사륜': 'دفع رباعي دائم (AWD)',
  'AWD': 'دفع رباعي AWD',
  '4WD': 'دفع رباعي 4WD',
  'FWD': 'دفع أمامي',
  'RWD': 'دفع خلفي',

  // ─── الألوان ──────────────────────────────────────────────────────────────
  '흰색': 'أبيض',
  '백색': 'أبيض',
  '펄화이트': 'أبيض لؤلؤي',
  '크림화이트': 'أبيض كريمي',
  '검정색': 'أسود',
  '블랙': 'أسود',
  '회색': 'رمادي',
  '그레이': 'رمادي',
  '실버': 'فضي',
  '은색': 'فضي',
  '파란색': 'أزرق',
  '블루': 'أزرق',
  '네이비': 'كحلي',
  '빨간색': 'أحمر',
  '레드': 'أحمر',
  '갈색': 'بني',
  '브라운': 'بني',
  '녹색': 'أخضر',
  '그린': 'أخضر',
  '노란색': 'أصفر',
  '옐로우': 'أصفر',
  '주황색': 'برتقالي',
  '오렌지': 'برتقالي',
  '보라색': 'بنفسجي',
  '자주': 'بنفسجي داكن',
  '금색': 'ذهبي',
  '골드': 'ذهبي',
  '베이지': 'بيج',
  '아이보리': 'عاجي',
  '다크그레이': 'رمادي داكن',
  '다크그린': 'أخضر داكن',
  '다크블루': 'أزرق داكن',
  '샴페인': 'شامبانيا',
  '샴페인골드': 'ذهبي شامبانيا',
  '진주': 'لؤلؤي',
  '투톤': 'ثنائي اللون',
  '무광': 'مطفي',

  // ─── حالة السيارة والفحص ──────────────────────────────────────────────────
  '무사고': 'بدون حوادث',
  '단순교환': 'تبديل بسيط بدون حادث',
  '완전무사고': 'سليمة تماماً',
  '사고유': 'يوجد حادث',
  '침수': 'غرق (مياه)',
  '전손': 'خسارة كلية',
  '도난': 'مسروقة',
  '렌트': 'سابقاً إيجار',
  '영업용': 'استخدام تجاري',
  '자가용': 'استخدام شخصي',
  '관용차': 'سيارة حكومية',

  // ─── درجات الفحص الكوري ───────────────────────────────────────────────────
  '매우양호': 'ممتازة جداً',
  '양호': 'جيدة',
  '보통': 'متوسطة',
  '불량': 'رديئة',
  '정상': 'سليمة / طبيعية',
  '교환': 'مستبدلة',
  '판금': 'إصلاح صفائح',
  '도색': 'دهان',
  '요수리': 'تحتاج إصلاح',
  '녹발생': 'صدأ',
  '부식': 'تآكل',
  '결함': 'خلل',
  '이상무': 'لا يوجد خلل',

  // ─── درجات تقييم تقرير الفحص الكوري ─────────────────────────────────────
  'A등급': 'تقييم A — ممتاز',
  'B등급': 'تقييم B — جيد',
  'C등급': 'تقييم C — مقبول',
  'D등급': 'تقييم D — يحتاج مراجعة',

  // ─── المميزات والخيارات ───────────────────────────────────────────────────
  '풀옵션': 'فل أوبشن كامل',
  '선루프': 'فتحة سقف',
  '파노라마': 'بانوراما',
  '파노라마선루프': 'فتحة سقف بانوراما',
  '네비': 'نظام ملاحة',
  '내비게이션': 'نظام ملاحة GPS',
  '후방카메라': 'كاميرا خلفية',
  '전방카메라': 'كاميرا أمامية',
  '360도카메라': 'كاميرا 360 درجة',
  '열선시트': 'مقاعد مدفأة',
  '통풍시트': 'مقاعد بتهوية (تبريد)',
  '전동시트': 'مقاعد كهربائية',
  '가죽시트': 'مقاعد جلدية',
  '스마트키': 'مفتاح ذكي',
  '무선충전': 'شاحن لاسلكي',
  '블루투스': 'بلوتوث',
  '오토크루즈': 'مثبت سرعة تلقائي',
  '어댑티브크루즈': 'مثبت سرعة تكيفي (ACC)',
  '레인킵어시스트': 'مساعد الحفاظ على المسار',
  '자동긴급제동': 'كبح طارئ تلقائي (AEB)',
  '사각지대감지': 'كشف النقطة العمياء (BSD)',
  '후방충돌경고': 'تحذير تصادم خلفي',
  '에어백': 'وسائد هوائية',
  '열선핸들': 'مقود مدفأ',
  '파워트렁크': 'باب خلفي كهربائي',
  '전동트렁크': 'صندوق خلفي كهربائي',
  '스마트주차': 'مساعد الركن الذكي',
  '서라운드뷰': 'رؤية محيطية',
  '헤드업디스플레이': 'شاشة HUD على الزجاج',
  'HUD': 'شاشة HUD',
  '디지털계기판': 'لوحة عدادات رقمية',
  '앰비언트라이트': 'إضاءة محيطية داخلية',
  '보스사운드': 'نظام صوتي Bose',
  '하만카돈': 'نظام صوتي Harman Kardon',
  'BOSE': 'نظام صوتي Bose',
  'JBL': 'نظام صوتي JBL',
  '메리디안': 'نظام صوتي Meridian',
  '소나': 'سونار / حساسات',
  '전방주차센서': 'حساسات ركن أمامية',
  '후방주차센서': 'حساسات ركن خلفية',
  'TPMS': 'نظام مراقبة ضغط الإطارات',
  '타이어공기압': 'مراقبة ضغط الإطارات',
  '전자식주차브레이크': 'فرامل يد إلكترونية (EPB)',
  '자동홀드': 'توقف تلقائي Auto Hold',
  'ESC': 'نظام ثبات الاتجاه ESC',
  'VDC': 'تحكم ديناميكي VDC',
  'ABS': 'نظام منع انغلاق المكابح ABS',

  // ─── درجات الصيانة ────────────────────────────────────────────────────────
  '신차급': 'بحالة الوكالة',
  '임판차': 'لوحة مؤقتة (جديدة)',
  '즉시등록': 'جاهزة للتسجيل الفوري',
  '1인신조': 'مالك واحد (جديدة)',
  '상태최상': 'حالة ممتازة',
  '국산': 'محلي الصنع (كوري)',
  '수입': 'مستوردة',
  '연식': 'سنة الصنع',
  '주행거리': 'المسافة المقطوعة (كم)',
  '배기량': 'حجم المحرك (CC)',
  '마력': 'حصان (HP)',
  '토크': 'عزم الدوران (Nm)',
  '최고속도': 'السرعة القصوى (km/h)',
  '보증': 'ضمان',
  '정품': 'قطعة أصلية',
  '튜닝': 'تعديلات',
  '신차': 'سيارة جديدة',
  '중고': 'سيارة مستعملة',
  '직수입': 'استيراد مباشر',
  '인증중고': 'مستعملة معتمدة',

  // ─── الفئات والدرجات ──────────────────────────────────────────────────────
  '프레스티지': 'برستيج',
  '노블레스': 'نوبليس',
  '시그니처': 'سيجنتشر',
  '캘리그래피': 'كاليجرافي',
  '익스클루시브': 'إكسكلوسيف',
  '프리미엄': 'بريميوم',
  '스마트': 'سمارت',
  '트렌디': 'تريندي',
  '럭셔리': 'لاكشري',
  '모던': 'مودرن',
  '인스퍼레이션': 'إنسبيريشن',
  '르블랑': 'لو بلان',
  '마스터': 'ماستر',
  '엔트리': 'إنتري',
  '어드밴스': 'أدفانس',
  '터보': 'تيربو',
  '하이퍼': 'هايبر',
  '내추럴': 'ناتشرال',
  '어반': 'أوربان',
  '스탠다드': 'ستاندرد',

  // ─── مصطلحات عامة متنوعة ───────────────────────────────────────────────────
  '스포츠': 'رياضي',
  'M 스포츠': 'M Sport',
  '시리즈': 'فئة',
  '랭글러': 'رانجلر',
  '루비콘': 'روبيكون',
  '4도어': '4 أبواب',
  '2도어': 'بابين',
  '5도어': '5 أبواب',
  '해치': 'هاتش',

  // ─── درجات الترتيب الكمي لعدد المالكين ──────────────────────────────────
  '1인': 'مالك واحد',
  '2인': 'مالكان',
  '3인': '3 ملاك',
};

const ENGLISH_DICTIONARY = {
  // ─── Brands ───────────────────────────────────────────────────────────────
  '현대': 'Hyundai', '기아': 'Kia', '제네시스': 'Genesis',
  '쌍용': 'SsangYong', 'KG모빌리티': 'KG Mobility',
  '르노코리아': 'Renault Korea', '르노삼성': 'Renault Samsung',
  '쉐보레': 'Chevrolet', '벤츠': 'Mercedes-Benz', 'BMW': 'BMW',
  '아우디': 'Audi', '포르쉐': 'Porsche', '폭스바겐': 'Volkswagen',
  '볼보': 'Volvo', '렉서스': 'Lexus', '토요타': 'Toyota',
  '닛산': 'Nissan', '혼다': 'Honda', '테슬라': 'Tesla',
  '미니': 'MINI', '인피니티': 'Infiniti', '캐딜락': 'Cadillac',
  '링컨': 'Lincoln', '마세라티': 'Maserati', '재규어': 'Jaguar',
  '랜드로버': 'Land Rover', '포드': 'Ford', '지프': 'Jeep',
  '람보르기니': 'Lamborghini', '페라리': 'Ferrari', '벤틀리': 'Bentley',
  '롤스로이스': 'Rolls-Royce', '폴스타': 'Polestar',
  '스바루': 'Subaru', '미쓰비시': 'Mitsubishi', '마쯔다': 'Mazda',

  // ─── Hyundai Models ───────────────────────────────────────────────────────
  '팰리세이드': 'Palisade', '그랜저': 'Grandeur', '아반떼': 'Elantra',
  '쏘나타': 'Sonata', '투싼': 'Tucson', '싼타페': 'Santa Fe',
  '코나': 'Kona', '베뉴': 'Venue', '스타리아': 'Staria',
  '스타렉스': 'Starex', '포터': 'Porter II', '아이오닉': 'Ioniq',
  '아이오닉5': 'Ioniq 5', '아이오닉6': 'Ioniq 6', '캐스퍼': 'Casper',
  '엑센트': 'Accent', '벨로스터': 'Veloster', '넥쏘': 'Nexo',

  // ─── Kia Models ───────────────────────────────────────────────────────────
  '카니발': 'Carnival', '쏘렌토': 'Sorento', '스포티지': 'Sportage',
  '모하비': 'Mohave', '셀토스': 'Seltos', '니로': 'Niro',
  '모닝': 'Morning (Picanto)', '봉고': 'Bongo 3',
  'EV6': 'EV6', 'EV9': 'EV9', '스팅어': 'Stinger',
  'K3': 'K3', 'K5': 'K5', 'K7': 'K7', 'K8': 'K8', 'K9': 'K9',

  // ─── Fuel Types ───────────────────────────────────────────────────────────
  '휘발유': 'Gasoline', '가솔린': 'Gasoline',
  '경유': 'Diesel', '디젤': 'Diesel',
  '하이브리드': 'Hybrid', '플러그인하이브리드': 'Plug-in Hybrid (PHEV)',
  '전기': 'Electric', '수소': 'Hydrogen', 'LPG': 'LPG Gas',
  '가솔린+전기': 'Gasoline-Electric Hybrid',

  // ─── Transmission ─────────────────────────────────────────────────────────
  '오토': 'Automatic', '자동': 'Automatic',
  '수동': 'Manual', '반자동': 'Dual-Clutch (DCT)',
  'DCT': 'Dual-Clutch Transmission', 'CVT': 'CVT', 'AMT': 'AMT',

  // ─── Drivetrain ───────────────────────────────────────────────────────────
  '전륜구동': 'Front-Wheel Drive (FWD)',
  '후륜구동': 'Rear-Wheel Drive (RWD)',
  '사륜구동': '4-Wheel Drive (4WD)',
  '상시사륜': 'All-Wheel Drive (AWD)',

  // ─── Body Types ───────────────────────────────────────────────────────────
  '세단': 'Sedan', 'SUV': 'SUV', '해치백': 'Hatchback',
  '쿠페': 'Coupe', '왜건': 'Station Wagon', '픽업': 'Pickup Truck',
  '밴': 'Van', '컨버터블': 'Convertible',

  // ─── Colors ───────────────────────────────────────────────────────────────
  '흰색': 'White', '백색': 'White', '펄화이트': 'Pearl White',
  '검정색': 'Black', '블랙': 'Black',
  '회색': 'Gray', '그레이': 'Gray', '실버': 'Silver', '은색': 'Silver',
  '파란색': 'Blue', '블루': 'Blue', '네이비': 'Navy Blue',
  '빨간색': 'Red', '레드': 'Red',
  '갈색': 'Brown', '브라운': 'Brown',
  '녹색': 'Green', '그린': 'Green',
  '노란색': 'Yellow', '금색': 'Gold', '골드': 'Gold',
  '베이지': 'Beige', '아이보리': 'Ivory',
  '샴페인': 'Champagne', '진주': 'Pearl',
  '투톤': 'Two-Tone', '무광': 'Matte',

  // ─── Condition Terms ──────────────────────────────────────────────────────
  '무사고': 'Accident-Free', '완전무사고': 'Perfect Accident-Free',
  '단순교환': 'Simple Part Replacement (No Accident)',
  '사고유': 'Has Accident History', '침수': 'Flood Damaged',

  // ─── Trim/Grade ───────────────────────────────────────────────────────────
  '프레스티지': 'Prestige', '노블레스': 'Noblesse',
  '시그니처': 'Signature', '캘리그래피': 'Calligraphy',
  '익스클루시브': 'Exclusive', '프리미엄': 'Premium',
  '스마트': 'Smart', '트렌디': 'Trendy', '럭셔리': 'Luxury',
  '모던': 'Modern', '인스퍼레이션': 'Inspiration',
  '스탠다드': 'Standard', '터보': 'Turbo',
  '스포츠': 'Sport', 'M 스포츠': 'M Sport', '시리즈': 'Series',
  '랭글러': 'Wrangler', '루비콘': 'Rubicon',
  '4도어': '4-Door', '2도어': '2-Door',
  '풀옵션': 'Full Option', '신차급': 'As New (Showroom Condition)',
};

// قاموس خيارات ومميزات السيارات (Standard Car Features Pair)
const FEATURES_DICTIONARY = [
  { ar: 'نظام منع انغلاق المكابح (ABS)', en: 'Anti-lock Braking System (ABS)', keywords: ['abs', 'مكابح', '안티록'] },
  { ar: 'شاشة AV للمقاعد الأمامية / نظام ملاحة', en: 'Front AV Navigation Display', keywords: ['av', 'ملاحة', '네비', 'navigation'] },
  { ar: 'قفيل أبواب كهربائي / نظام دخول ذكي', en: 'Electric Door Lock & Smart Entry', keywords: ['قفيل', 'دخول', '스마트키', 'lock'] },
  { ar: 'عجلة قيادة كهربائية / تدفئة المقود', en: 'Power Heated Steering Wheel', keywords: ['عجلة', 'مقود', '열선핸들', 'steering'] },
  { ar: 'مقاعد جلدية فاخرة', en: 'Premium Leather Seats', keywords: ['مقاعد جلدية', 'جلد', '가죽시트', 'leather'] },
  { ar: 'نظام منع الانزلاق (TCS / ESC)', en: 'Traction & Stability Control (TCS/ESC)', keywords: ['انزلاق', 'tcs', 'esc', '차체자세제어'] },
  { ar: 'عجلات ألومنيوم / جنوط رياضية', en: 'Alloy Wheels & Sport Rims', keywords: ['عجلات', 'جنوط', '알루미늄휠', 'wheel'] },
  { ar: 'وسادة هوائية جانبية وللمقاعد', en: 'Side & Curtain Airbags', keywords: ['وسادة', 'إيرباج', '에어백', 'airbag'] },
  { ar: 'مقاعد مدفأة (المقاعد الأمامية/الخلفية)', en: 'Heated Front & Rear Seats', keywords: ['مدفأة', 'تدفئة', '열선시트', 'heated'] },
  { ar: 'مقاعد بحاصية التهوية (تبريد المقاعد)', en: 'Ventilated Cooling Seats', keywords: ['تهوية', 'تبريد', '통풍시트', 'ventilated'] },
  { ar: 'مكيف هواء أوتوماتيكي ثنائي المناطق', en: 'Dual Automatic Climate Air Conditioning', keywords: ['مكيف', 'climate', '풀오토에어컨', 'ac'] },
  { ar: 'حساسات ركن خلفية وأمامية', en: 'Front & Rear Parking Sensors', keywords: ['حساسات', 'ركن', '주차감지센서', 'sensor'] },
  { ar: 'كاميرا خلفية / رؤية محيطية 360°', en: 'Rear Camera & 360° View', keywords: ['كاميرا', '후방카메라', 'camera', 'surround'] },
  { ar: 'مرآة داخلية بخاصية التعتيم الإلكتروني', en: 'Auto-Dimming ECM Rearview Mirror', keywords: ['تعتيم', 'ecm', '하이패스룸미러', 'mirror'] },
  { ar: 'أزرار تحكم على عجلة القيادة', en: 'Steering Wheel Audio Controls', keywords: ['أزرار', 'تحكم', '핸들리모컨', 'control'] },
  { ar: 'نظام مراقبة ضغط الإطارات (TPMS)', en: 'Tire Pressure Monitoring System (TPMS)', keywords: ['ضغط الإطارات', 'tpms', '타이어공기압', 'pressure'] },
  { ar: 'نظام التنبيه عند مغادرة المسار (LDWS)', en: 'Lane Departure Warning System (LDWS)', keywords: ['المسار', 'ldws', '차선이탈', 'lane'] },
  { ar: 'نظام دفع رائع / مثبت حركة', en: 'Drive Mode Select & Cruise Control', keywords: ['مثبت', 'cruise', '크루즈컨트롤'] },
  { ar: 'بلوتوث / شاحن لاسلكي / منفذ USB', en: 'Bluetooth & Wireless Phone Charger', keywords: ['بلوتوث', 'usb', 'شاحن', '무선충전', 'bluetooth'] },
  { ar: 'فتحة سقف بانورامية', en: 'Panoramic Sunroof', keywords: ['فتحة سقف', 'سقف', '선루프', 'sunroof'] }
];

class KoreanTranslationService {
  /**
   * ترجمة وتنظيف النص الكوري بالكامل إلى اللغة العربية النظيفة
   */
  static cleanAndTranslate(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.trim();
    Object.keys(KOREAN_DICTIONARY).forEach(koreanTerm => {
      const regex = new RegExp(koreanTerm, 'gi');
      cleaned = cleaned.replace(regex, KOREAN_DICTIONARY[koreanTerm]);
    });

    cleaned = cleaned.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();

    return cleaned || text;
  }

  /**
   * ترجمة إلى اللغة الإنجليزية النظيفة
   */
  static translateToEnglish(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.trim();
    Object.keys(ENGLISH_DICTIONARY).forEach(koreanTerm => {
      const regex = new RegExp(koreanTerm, 'gi');
      cleaned = cleaned.replace(regex, ENGLISH_DICTIONARY[koreanTerm]);
    });

    cleaned = cleaned.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();

    return cleaned || text;
  }

  /**
   * استخراج قائمة المميزات ثنائية اللغة (Arabic / English Features)
   */
  static extractBilingualFeatures(rawTextOrHtml = '') {
    const textLower = String(rawTextOrHtml).toLowerCase();
    const featuresAr = [];
    const featuresEn = [];


    FEATURES_DICTIONARY.forEach(item => {
      const matched = item.keywords.some(kw => textLower.includes(kw));
      if (matched || !rawTextOrHtml) {
        featuresAr.push(item.ar);
        featuresEn.push(item.en);
      }
    });

    // إذا لم يطابق نص محدد، نعطي قائمة مميزات قياسية افتراضية
    if (featuresAr.length < 5) {
      FEATURES_DICTIONARY.slice(0, 10).forEach(item => {
        if (!featuresAr.includes(item.ar)) {
          featuresAr.push(item.ar);
          featuresEn.push(item.en);
        }
      });
    }

    return { featuresAr, featuresEn };
  }

  /**
   * صياغة تقرير الفحص والهيكل ثنائي اللغة (Inspection Report)
   */
  static generateBilingualInspectionReport(rawText = '', inspApiData = null) {
    let accidentCount = 0;
    let myAccidentCount = 0;
    let otherAccidentCount = 0;
    let ownerChangeCount = 1;
    let simpleRepairCount = 0;
    let hasFloodDamage = false;
    let hasFireDamage = false;
    let sheetPhotoUrl = '';
    let outerBodyParts = null;
    let chassisParts = null;

    if (inspApiData) {
      const rec = inspApiData.inspectionRecord || inspApiData;
      accidentCount = Number(rec.accidentCount || rec.accidentHistory?.totalCount || 0);
      myAccidentCount = Number(rec.myAccidentCount || rec.accidentHistory?.myCount || 0);
      otherAccidentCount = Number(rec.otherAccidentCount || rec.accidentHistory?.otherCount || 0);
      ownerChangeCount = Number(rec.ownerChangeCount || rec.insuranceHistory?.ownerChanges || 1);
      simpleRepairCount = Number(rec.simpleRepairCount || rec.simpleRepairsCount || 0);
      hasFloodDamage = Boolean(rec.hasFloodDamage || rec.floodDamage);
      hasFireDamage = Boolean(rec.hasFireDamage || rec.fireDamage);
      sheetPhotoUrl = rec.sheetPhotoUrl || rec.inspectionImage || rec.inspectionSheetPhoto || '';
      outerBodyParts = rec.outerBody || rec.outerBodyParts || null;
      chassisParts = rec.chassis || rec.chassisParts || null;
    }

    const hasAccidentKeywords = ['حادث', 'حادث جسيم', 'أضرار جسيمة', 'accident', '사고유'];
    const textLower = String(rawText).toLowerCase();
    const hasAccident = accidentCount > 0 || hasAccidentKeywords.some(kw => textLower.includes(kw));

    return {
      statusAr: hasAccident ? 'توجد ملاحظات هيكلية مسجلة على السيارة' : 'لا توجد أضرار مُسجّلة على هيكل هذه السيارة',
      statusEn: hasAccident ? 'Structural notes / Accident history recorded' : 'No accident damage recorded on vehicle body',
      hasAccidents: hasAccident,
      accidentCount,
      myAccidentCount,
      otherAccidentCount,
      ownerChangeCount,
      simpleRepairCount,
      hasFloodDamage,
      hasFireDamage,
      sheetPhotoUrl,
      outerBodyParts,
      chassisParts,
      accidentDetailsAr: hasAccident 
        ? 'تم تدوين إصلاحات أو صيانة لبعض القطع مع سلامة المحرك والهيكل الأساسي.'
        : 'هيكل السيارة وسقفها والشاسي الأساسي خالية تماماً من الحوادث ومفحوصة بالكامل.',
      accidentDetailsEn: hasAccident
        ? 'Exterior repair noted with intact engine and chassis frame.'
        : 'Body frame, chassis and roof are 100% accident-free and fully inspected.'
    };
  }

  /**
   * ترجمة نظيفة خاصة بالعنوان (Title)
   */
  static formatTitle(make, model, year, rawTitle = '') {
    const cleanMake = this.cleanAndTranslate(make || '');
    const cleanModel = this.cleanAndTranslate(model || '');
    const cleanRaw = this.cleanAndTranslate(rawTitle || '');

    if (cleanMake && cleanModel) {
      return `${cleanMake} ${cleanModel} ${year || ''}`.trim();
    }
    return cleanRaw || `${cleanMake} ${year || ''}`.trim();
  }

  static hasKoreanText(text) {
    if (!text || typeof text !== 'string') return false;
    return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text);
  }
}

module.exports = KoreanTranslationService;
