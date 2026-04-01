// Unit Tests for Validators Utils
const { expect } = require('chai');
const {
    sanitizeInput,
    sanitizeObject,
    isValidEmail,
    isValidPhone,
    isStrongPassword,
    calculatePasswordStrength,
    isValidName,
    isValidObjectId,
    isValidUrl,
    isValidPrice,
    isValidYear,
    isPositiveNumber,
    isValidDate,
    isInEnum,
    isValidImageType,
    isValidFileSize,
    isValidBidAmount
} = require('../../../utils/validators');

describe('Validators Utils - Unit Tests', () => {
    describe('sanitizeInput', () => {
        it('should remove script tags', () => {
            const input = '<script>alert("xss")</script>Hello';
            const result = sanitizeInput(input);
            expect(result).to.equal('Hello');
        });

        it('should remove HTML tags', () => {
            const input = '<div>Hello</div><p>World</p>';
            const result = sanitizeInput(input);
            expect(result).to.equal('HelloWorld');
        });

        it('should remove javascript: protocol', () => {
            const input = 'javascript:alert("xss")';
            const result = sanitizeInput(input);
            expect(result).to.equal('alert("xss")');
        });

        it('should trim whitespace', () => {
            const input = '  Hello World  ';
            const result = sanitizeInput(input);
            expect(result).to.equal('Hello World');
        });

        it('should return non-string values unchanged', () => {
            expect(sanitizeInput(123)).to.equal(123);
            expect(sanitizeInput(null)).to.equal(null);
        });
    });

    describe('sanitizeObject', () => {
        it('should sanitize all string values in object', () => {
            const obj = {
                name: '<script>alert("xss")</script>John',
                age: 25,
                bio: '<div>Developer</div>'
            };
            const result = sanitizeObject(obj);
            expect(result.name).to.equal('John');
            expect(result.age).to.equal(25);
            expect(result.bio).to.equal('Developer');
        });

        it('should handle nested objects', () => {
            const obj = {
                user: {
                    name: '<b>John</b>',
                    email: 'john@example.com'
                }
            };
            const result = sanitizeObject(obj);
            expect(result.user.name).to.equal('John');
        });
    });

    describe('isValidEmail', () => {
        it('should validate correct email', () => {
            expect(isValidEmail('test@example.com')).to.be.true;
            expect(isValidEmail('user.name@domain.co.uk')).to.be.true;
        });

        it('should reject invalid email', () => {
            expect(isValidEmail('invalid')).to.be.false;
            expect(isValidEmail('test@')).to.be.false;
            expect(isValidEmail('@example.com')).to.be.false;
        });

        it('should handle empty or null values', () => {
            expect(isValidEmail('')).to.be.false;
            expect(isValidEmail(null)).to.be.false;
        });
    });

    describe('isValidPhone', () => {
        it('should validate Saudi phone numbers', () => {
            expect(isValidPhone('0512345678')).to.be.true;
            expect(isValidPhone('512345678')).to.be.true;
            expect(isValidPhone('+966512345678')).to.be.true;
        });

        it('should validate international numbers', () => {
            expect(isValidPhone('+1234567890')).to.be.true;
        });

        it('should reject invalid phone numbers', () => {
            expect(isValidPhone('123')).to.be.false;
            expect(isValidPhone('abc')).to.be.false;
        });

        it('should handle phone with spaces and dashes', () => {
            expect(isValidPhone('051-234-5678')).to.be.true;
            expect(isValidPhone('051 234 5678')).to.be.true;
        });
    });

    describe('isStrongPassword', () => {
        it('should validate strong password', () => {
            const result = isStrongPassword('MyP@ssw0rd123');
            expect(result.valid).to.be.true;
            expect(result.errors).to.be.empty;
        });

        it('should reject short password', () => {
            const result = isStrongPassword('Pass1!');
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('يجب أن تكون 8 أحرف على الأقل');
        });

        it('should reject password without uppercase', () => {
            const result = isStrongPassword('myp@ssw0rd');
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('يجب أن تحتوي على حرف كبير');
        });

        it('should reject password without number', () => {
            const result = isStrongPassword('MyP@ssword');
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('يجب أن تحتوي على رقم');
        });

        it('should reject common passwords', () => {
            const result = isStrongPassword('password');
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('كلمة المرور شائعة جداً');
        });

        it('should calculate password strength', () => {
            const weak = isStrongPassword('Pass1!');
            const strong = isStrongPassword('MyV3ry$tr0ngP@ssw0rd!');
            expect(strong.strength).to.equal('strong');
        });
    });

    describe('calculatePasswordStrength', () => {
        it('should return weak for simple passwords', () => {
            expect(calculatePasswordStrength('pass')).to.equal('weak');
        });

        it('should return strong for complex passwords', () => {
            expect(calculatePasswordStrength('MyV3ry$tr0ngP@ssw0rd!')).to.equal('strong');
        });
    });

    describe('isValidName', () => {
        it('should validate English names', () => {
            const result = isValidName('John Doe');
            expect(result.valid).to.be.true;
        });

        it('should validate Arabic names', () => {
            const result = isValidName('محمد أحمد');
            expect(result.valid).to.be.true;
        });

        it('should reject short names', () => {
            const result = isValidName('A');
            expect(result.valid).to.be.false;
        });

        it('should require two words when specified', () => {
            const result = isValidName('John', { requireTwoWords: true });
            expect(result.valid).to.be.false;
        });

        it('should allow numbers when specified', () => {
            const result = isValidName('User123', { allowNumbers: true });
            expect(result.valid).to.be.true;
        });
    });

    describe('isValidObjectId', () => {
        it('should validate correct MongoDB ObjectId', () => {
            expect(isValidObjectId('507f1f77bcf86cd799439011')).to.be.true;
        });

        it('should reject invalid ObjectId', () => {
            expect(isValidObjectId('invalid')).to.be.false;
            expect(isValidObjectId('123')).to.be.false;
        });

        it('should handle null or undefined', () => {
            expect(isValidObjectId(null)).to.be.false;
            expect(isValidObjectId(undefined)).to.be.false;
        });
    });

    describe('isValidUrl', () => {
        it('should validate correct URLs', () => {
            expect(isValidUrl('https://example.com')).to.be.true;
            expect(isValidUrl('http://test.com/path')).to.be.true;
        });

        it('should reject invalid URLs', () => {
            expect(isValidUrl('not-a-url')).to.be.false;
            expect(isValidUrl('ftp://example.com')).to.be.false;
        });

        it('should require protocol', () => {
            expect(isValidUrl('example.com')).to.be.false;
        });
    });

    describe('isValidPrice', () => {
        it('should validate correct price', () => {
            const result = isValidPrice(1000);
            expect(result.valid).to.be.true;
            expect(result.value).to.equal(1000);
        });

        it('should reject negative price', () => {
            const result = isValidPrice(-100);
            expect(result.valid).to.be.false;
        });

        it('should reject zero when not allowed', () => {
            const result = isValidPrice(0, { allowZero: false });
            expect(result.valid).to.be.false;
        });

        it('should enforce min and max', () => {
            const tooLow = isValidPrice(50, { min: 100 });
            const tooHigh = isValidPrice(1000, { max: 500 });
            expect(tooLow.valid).to.be.false;
            expect(tooHigh.valid).to.be.false;
        });
    });

    describe('isValidYear', () => {
        it('should validate current year', () => {
            const currentYear = new Date().getFullYear();
            const result = isValidYear(currentYear);
            expect(result.valid).to.be.true;
        });

        it('should reject future years', () => {
            const futureYear = new Date().getFullYear() + 10;
            const result = isValidYear(futureYear);
            expect(result.valid).to.be.false;
        });

        it('should reject very old years', () => {
            const result = isValidYear(1800);
            expect(result.valid).to.be.false;
        });
    });

    describe('isPositiveNumber', () => {
        it('should validate positive numbers', () => {
            const result = isPositiveNumber(100);
            expect(result.valid).to.be.true;
            expect(result.value).to.equal(100);
        });

        it('should reject negative numbers', () => {
            const result = isPositiveNumber(-10);
            expect(result.valid).to.be.false;
        });

        it('should enforce integer when specified', () => {
            const result = isPositiveNumber(10.5, { integer: true });
            expect(result.valid).to.be.true;
            expect(result.value).to.equal(10);
        });
    });

    describe('isValidDate', () => {
        it('should validate correct date', () => {
            const result = isValidDate('2024-01-01');
            expect(result.valid).to.be.true;
        });

        it('should reject invalid date', () => {
            const result = isValidDate('invalid-date');
            expect(result.valid).to.be.false;
        });

        it('should reject past dates when not allowed', () => {
            const pastDate = new Date('2020-01-01');
            const result = isValidDate(pastDate, { allowPast: false });
            expect(result.valid).to.be.false;
        });

        it('should reject future dates when not allowed', () => {
            const futureDate = new Date('2030-01-01');
            const result = isValidDate(futureDate, { allowFuture: false });
            expect(result.valid).to.be.false;
        });
    });

    describe('isInEnum', () => {
        it('should validate value in enum', () => {
            const result = isInEnum('admin', ['admin', 'user', 'guest']);
            expect(result.valid).to.be.true;
        });

        it('should reject value not in enum', () => {
            const result = isInEnum('superuser', ['admin', 'user']);
            expect(result.valid).to.be.false;
        });

        it('should handle case insensitive comparison', () => {
            const result = isInEnum('ADMIN', ['admin', 'user'], { caseSensitive: false });
            expect(result.valid).to.be.true;
        });
    });

    describe('isValidImageType', () => {
        it('should validate allowed image types', () => {
            expect(isValidImageType('image/jpeg')).to.be.true;
            expect(isValidImageType('image/png')).to.be.true;
            expect(isValidImageType('image/webp')).to.be.true;
        });

        it('should reject non-image types', () => {
            expect(isValidImageType('application/pdf')).to.be.false;
            expect(isValidImageType('text/plain')).to.be.false;
        });
    });

    describe('isValidFileSize', () => {
        it('should validate file within size limit', () => {
            const size = 3 * 1024 * 1024; // 3MB
            expect(isValidFileSize(size, 5)).to.be.true;
        });

        it('should reject file exceeding size limit', () => {
            const size = 10 * 1024 * 1024; // 10MB
            expect(isValidFileSize(size, 5)).to.be.false;
        });
    });

    describe('isValidBidAmount', () => {
        it('should validate correct bid amount', () => {
            const result = isValidBidAmount(1500, 1000, 100);
            expect(result.valid).to.be.true;
            expect(result.value).to.equal(1500);
        });

        it('should reject bid lower than current price', () => {
            const result = isValidBidAmount(900, 1000);
            expect(result.valid).to.be.false;
        });

        it('should reject bid below minimum increment', () => {
            const result = isValidBidAmount(1050, 1000, 100);
            expect(result.valid).to.be.false;
        });
    });
});
