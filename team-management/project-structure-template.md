# قالب تنظيم المشاريع

## هيكل المشروع المعياري

```
project-name/
├── frontend/                 # مسؤولية المبرمج الأول
│   ├── src/
│   │   ├── components/      # المكونات القابلة لإعادة الاستخدام
│   │   ├── pages/          # صفحات التطبيق
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── utils/          # وظائف مساعدة
│   │   └── styles/         # ملفات التصميم
│   ├── public/             # الملفات العامة
│   └── package.json        # dependencies
│
├── backend/                 # مسؤولية المبرمج الثاني
│   ├── src/
│   │   ├── controllers/    # منطق التحكم
│   │   ├── models/         # نماذج قاعدة البيانات
│   │   ├── routes/         # مسارات API
│   │   ├── middleware/     # وسطاء المصادقة والأمان
│   │   └── utils/          # وظائف مساعدة
│   ├── config/             # إعدادات قاعدة البيانات
│   └── package.json
│
├── shared/                  # مسؤولية مشتركة
│   ├── types/              # أنواع البيانات المشتركة
│   ├── constants/          # الثوابت
│   └── interfaces/         # واجهات البرمجة
│
├── docs/                   # التوثيق
│   ├── api.md             # توثيق API
│   ├── setup.md           # دليل التثبيت
│   └── features.md        # شرح المميزات
│
├── scripts/               # سكريبتات التشغيل
│   ├── deploy.sh         # نشر التطبيق
│   ├── test.sh           # تشغيل الاختبارات
│   └── backup.sh         # نسخ احتياطية
│
└── README.md             # دليل المشروع
```

## تقسيم المسؤوليات

### Frontend Developer (المبرمج الأول)
```javascript
// مثال على مهامه اليومية
// 1. إنشاء components
const UserCard = ({ user }) => {
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
};

// 2. إدارة الحالة (State Management)
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);

// 3. التفاعل مع APIs
const fetchUsers = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    setLoading(false);
  }
};
```

### Backend Developer (المبرمج الثاني)
```javascript
// مثال على مهامه اليومية
// 1. إنشاء APIs
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. إدارة قاعدة البيانات
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 3. المصادقة والأمان
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### Full Stack + Manager (أنت)
```javascript
// مهامك الأساسية
// 1. ربط Frontend مع Backend
// 2. مراجعة الكود
// 3. حل المشاكل المعقدة
// 4. إدارة المشروع

// مثال على Integration
class ProjectIntegrator {
  async integrateComponents() {
    // التأكد من توافق APIs
    await this.validateAPIEndpoints();
    
    // اختبار التكامل
    await this.runIntegrationTests();
    
    // نشر التطبيق
    await this.deployApplication();
  }
  
  async reviewTeamCode() {
    // مراجعة كود Frontend
    const frontendIssues = await this.reviewFrontend();
    
    // مراجعة كود Backend
    const backendIssues = await this.reviewBackend();
    
    // تقديم ملاحظات للفريق
    await this.provideFeedback(frontendIssues, backendIssues);
  }
}
```

## نظام Git للفريق

### Branch Strategy
```bash
# الفروع الأساسية
main                    # الكود المستقر للإنتاج
develop                 # الكود قيد التطوير
feature/frontend-*      # مميزات Frontend
feature/backend-*       # مميزات Backend
hotfix/*               # إصلاحات عاجلة

# مثال على workflow
git checkout develop
git pull origin develop
git checkout -b feature/frontend-user-profile
# العمل على المميزة
git add .
git commit -m "إضافة صفحة الملف الشخصي"
git push origin feature/frontend-user-profile
# إنشاء Pull Request للمراجعة
```

### Code Review Process
1. **كل مبرمج ينشئ Pull Request**
2. **مراجعة من مبرمج آخر**
3. **مراجعة نهائية منك**
4. **دمج في develop**
5. **اختبار شامل**
6. **دمج في main للنشر**

## قواعد التوثيق

### لكل function يجب:
```javascript
/**
 * وصف الوظيفة بالعربية
 * @param {string} email - البريد الإلكتروني للمستخدم
 * @param {string} password - كلمة المرور
 * @returns {Promise<Object>} - بيانات المستخدم أو خطأ
 * @author اسم المبرمج
 * @date تاريخ الإنشاء
 * @aiAssisted نعم/لا - هل استخدم الذكاء الاصطناعي؟
 */
async function loginUser(email, password) {
  // منطق تسجيل الدخول
}
```

### لكل component يجب:
```javascript
/**
 * مكون عرض بطاقة المستخدم
 * المسؤول: Frontend Developer
 * التاريخ: 2024-01-15
 * الحالة: مكتمل
 * اختبار: تم
 */
const UserCard = ({ user }) => {
  // كود المكون
};
```

## نظام الاختبار

### Frontend Testing
```javascript
// اختبار المكونات
import { render, screen } from '@testing-library/react';
import UserCard from './UserCard';

test('يعرض اسم المستخدم بشكل صحيح', () => {
  const user = { name: 'أحمد محمد', email: 'ahmed@example.com' };
  render(<UserCard user={user} />);
  expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
});
```

### Backend Testing
```javascript
// اختبار APIs
const request = require('supertest');
const app = require('../app');

describe('GET /api/users', () => {
  test('يجب أن يعيد قائمة المستخدمين', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```