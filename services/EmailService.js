// [[ARABIC_HEADER]] هذا الملف (services/EmailService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/EmailService.js
 * خدمة البريد الإلكتروني
 *
 * الوصف:
 * - إرسال رسائل بريد إلكتروني للمستخدمين
 * - دعم قوالب البريد الإلكتروني
 * - إشعارات عبر البريد الإلكتروني
 */

const nodemailer = require('nodemailer');

class EmailService {
    static getTransporter() {
        // دعم متغيرات SMTP الجديدة مع التوافق مع القديمة
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        
        if (!smtpUser || !smtpPass) {
            return null;
        }

        try {
            const smtpHost = process.env.SMTP_HOST;
            const smtpPort = process.env.SMTP_PORT;

            // إذا تم تحديد SMTP_HOST نستخدم الإعدادات المخصصة
            if (smtpHost) {
                return nodemailer.createTransport({
                    host: smtpHost,
                    port: parseInt(smtpPort) || 587,
                    secure: parseInt(smtpPort) === 465,
                    auth: { user: smtpUser, pass: smtpPass }
                });
            }

            // fallback: استخدام service name
            return nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: { user: smtpUser, pass: smtpPass }
            });
        } catch (e) {
            console.warn('⚠️ Email transporter not configured:', e.message);
            return null;
        }
    }

    /**
     * إرسال بريد إلكتروني
     * @param {Object} options - خيارات البريد
     * @param {string} options.to - البريد المستلم
     * @param {string} options.subject - عنوان الرسالة
     * @param {string} options.html - محتوى HTML
     * @param {string} options.text - محتوى نصي
     */
    static async sendEmail({ to, subject, html, text }) {
        const transporter = this.getTransporter();
        if (!transporter) {
            console.log(`[EmailService] Skipped sending email to ${to} (not configured)`);
            return { success: false, reason: 'not_configured' };
        }

        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_FROM || `HM CAR <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                text
            });
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * إرسال إشعار بريد إلكتروني لمستخدم
     * @param {string} userId - معرف المستخدم
     * @param {Object} template - قالب الإشعار
     */
    static async sendNotificationEmail(userId, template) {
        try {
            const User = require('../models/User');
            const user = await User.findById(userId);
            if (!user || !user.email) return;

            await this.sendEmail({
                to: user.email,
                subject: template.title || 'إشعار من HM CAR',
                html: `
                    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
                        <h2 style="color: #c9a96e;">${template.title}</h2>
                        <p>${template.message}</p>
                        ${template.actionUrl ? `<a href="${process.env.BASE_URL || 'https://hmcar-system-two.vercel.app'}${template.actionUrl}" style="background: #c9a96e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">عرض التفاصيل</a>` : ''}
                        <hr style="border: 1px solid #eee; margin-top: 20px;" />
                        <p style="color: #999; font-size: 12px;">HM CAR - منصة مزادات السيارات الفاخرة</p>
                    </div>
                `,
                text: `${template.title}\n${template.message}`
            });
        } catch (error) {
            console.warn('⚠️ Failed to send notification email:', error.message);
        }
    }
    /**
     * إرسال رابط استعادة كلمة المرور
     * @param {string} email - البريد المستلم
     * @param {string} name - اسم المستخدم
     * @param {string} resetUrl - رابط إعادة التعيين
     */
    static async sendPasswordReset(email, name, resetUrl) {
        return this.sendEmail({
            to: email,
            subject: 'إعادة تعيين كلمة المرور — HM CAR',
            text: `مرحباً ${name}،\n\nاضغط على الرابط التالي لإعادة تعيين كلمة مرورك (صالح ساعة):\n${resetUrl}\n\nإذا لم تطلب هذا، تجاهل الرسالة.\n\nHM CAR Team`,
            html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 30px; background: #0a0a0f; color: #fff; border-radius: 12px; max-width: 500px; margin: auto;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #c9a96e; font-size: 24px; margin: 0;">🔐 HM CAR</h1>
                        <p style="color: #888; font-size: 13px; margin: 4px 0 0;">استعادة كلمة المرور</p>
                    </div>
                    <p style="color: #ccc; font-size: 15px;">مرحباً <strong style="color: #fff;">${name}</strong>،</p>
                    <p style="color: #aaa; font-size: 14px; line-height: 1.7;">تلقّينا طلب إعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة.</p>
                    <div style="text-align: center; margin: 28px 0;">
                        <a href="${resetUrl}" style="background: linear-gradient(135deg, #c9a96e, #d4b87e); color: #000; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">
                            إعادة تعيين كلمة المرور →
                        </a>
                    </div>
                    <p style="color: #666; font-size: 12px; text-align: center;">⏱️ هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
                    <p style="color: #555; font-size: 12px; text-align: center;">إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة بأمان.</p>
                    <hr style="border: 1px solid #222; margin: 24px 0;" />
                    <p style="color: #444; font-size: 11px; text-align: center;">HM CAR — منصة مزادات السيارات الفاخرة</p>
                </div>
            `
        });
    }
}

module.exports = EmailService;
