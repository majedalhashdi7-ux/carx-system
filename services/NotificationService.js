// [[ARABIC_HEADER]] هذا الملف (services/NotificationService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/NotificationService.js
 * خدمة الإشعارات المتقدمة
 *
 * الوصف:
 * - إرسال إشعارات للمستخدمين عند أحداث معينة
 * - دعم أنواع مختلفة: مزادات، طلبات، رسائل، نظامية
 * - تخزين الإشعارات في قاعدة البيانات
 * - إشعارات مجدولة ومخصصة
 * - إدارة قوالب الإشعارات
 * - إشعارات جماعية متقدمة
 */
// ⚠️ متوافق مع Multi-Tenant: تقبل models كمعامل
const WebSocketService = require('./WebSocketService');
const EmailService = require('./EmailService');
const webpush = require('web-push');

/**
 * إعداد مفاتيح VAPID لإرسال إشعارات PWA
 * يتم سحبها من متغيرات البيئة لضمان الأمان
 */
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:info@hmcar.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

class NotificationService {

    /**
     * إنشاء إشعار في قاعدة البيانات
     */
    static async createNotification(models, notificationData) {
        if (!models || !models.UserNotification) {
            throw new Error('UserNotification model is required');
        }
        return await models.UserNotification.create(notificationData);
    }

    /**
     * إرسال إشعار لمستخدم بناءً على تفضيلاته
     */
    static async sendNotification(models, userId, notificationType, template) {
        if (!models) throw new Error('models is required for sendNotification');
        
        const { UserNotificationPreference } = models;
        const preferences = await UserNotificationPreference.findOne({ user: userId });

        // التفضيلات الافتراضية
        const defaultPrefs = {
            [notificationType]: true,
            emailNotifications: { [notificationType]: true },
            pushNotifications: { [notificationType]: true },
        };

        const userPrefs = preferences || defaultPrefs;

        // التحقق مما إذا كان المستخدم يريد هذا النوع من الإشعارات
        if (userPrefs[notificationType] !== false) {
            const notification = await this.createNotification(models, {
                user: userId,
                ...template,
                status: 'unread'
            });

            // 1. الإرسال عبر WebSocket (فوري داخل الموقع)
            WebSocketService.sendToUser(userId, {
                id: notification._id,
                title: template.title,
                message: template.message,
                type: template.type,
                data: template.metadata,
                actionUrl: template.actionUrl
            });

            // 2. الإرسال عبر Web Push (خارج الموقع - PWA)
            if (userPrefs.pushNotifications && userPrefs.pushNotifications[notificationType] !== false) {
                this.sendPushToUser(models, userId, {
                    title: template.title,
                    body: template.message,
                    url: template.actionUrl || '/'
                }).catch(err => console.error('WebPush Error:', err.message));
            }

            // 3. الإرسال عبر البريد الإلكتروني
            if (userPrefs.emailNotifications && userPrefs.emailNotifications[notificationType] === true) {
                EmailService.sendNotificationEmail(userId, template).catch(err => {
                    console.warn('⚠️ Email notification failed:', err.message);
                });
            }
        }
    }

    /**
     * إشعارات المزادات
     */
    static async sendAuctionNotification(models, userId, auction, type, data = {}) {
        if (!models) throw new Error('models is required for sendAuctionNotification');
        const templates = {
            'outbid': {
                title: 'لقد تمت المزايدة عليك!',
                message: `مستخدم آخر قام بوضع مزايدة أعلى في مزاد ${auction.title}.`,
                type: 'warning',
                priority: 'high',
                actionUrl: `/auctions/${auction._id}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            },
            'auction_ending': {
                title: 'المزاد على وشك الانتهاء',
                message: `مزاد ${auction.title} سينتهي خلال ساعة.`,
                type: 'auction',
                priority: 'high',
                actionUrl: `/auctions/${auction._id}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            },
            'auction_won': {
                title: 'تهانينا! لقد فزت بالمزاد',
                message: `لقد فزت بمزاد ${auction.title}.`,
                type: 'success',
                priority: 'high',
                actionUrl: `/orders/${data.orderId}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            },
            'auction_lost': {
                title: 'انتهى المزاد',
                message: `للأسف، لم تفز بمزاد ${auction.title}. حظاً أوفر في المرة القادمة!`,
                type: 'info',
                actionUrl: `/auctions/${auction._id}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            }
        };

        const template = templates[type];
        if (!template) return;

        await this.sendNotification(models, userId, type, template);
    }

    /**
     * إشعارات الرسائل
     */
    static async sendMessageNotification(models, userId, message) {
        if (!models) throw new Error('models is required for sendMessageNotification');
        const template = {
            title: 'رسالة جديدة',
            message: `لديك رسالة جديدة من ${message.sender.name}.`,
            type: 'message',
            relatedTo: message.conversation,
            relatedToModel: 'Conversation',
            actionUrl: `/messages/conversation/${message.conversation}`,
            metadata: { senderId: message.sender._id }
        };
        await this.sendNotification(models, userId, 'newMessage', template);
    }
    
    /**
     * تحديثات النظام
     */
    static async sendSystemUpdate(models, userId, title, message, data = {}) {
        if (!models) throw new Error('models is required for sendSystemUpdate');
        const template = {
            title: title,
            message: message,
            type: 'system',
            priority: data.priority || 'medium',
            actionUrl: data.actionUrl,
            actionText: data.actionText,
        };
        await this.sendNotification(models, userId, 'systemUpdates', template);
    }

    /**
     * إرسال إشعار جماعي
     */
    static async sendBulkNotification(models, userIds, template, notificationType) {
        if (!models) throw new Error('models is required for sendBulkNotification');
        
        const { UserNotification, UserNotificationPreference } = models;
        const preferences = await UserNotificationPreference.find({ user: { $in: userIds } });
        const prefMap = new Map(preferences.map(p => [p.user.toString(), p]));

        const notificationsToCreate = [];
        const usersToNotifyByPush = [];

        for (const userId of userIds) {
            const userPrefs = prefMap.get(userId) || {};
            if (userPrefs[notificationType] !== false) {
                notificationsToCreate.push({ user: userId, ...template });

                if (userPrefs.pushNotifications && userPrefs.pushNotifications[notificationType] !== false) {
                    usersToNotifyByPush.push(userId);
                }
            }
        }

        if (notificationsToCreate.length > 0 && UserNotification) {
            await UserNotification.insertMany(notificationsToCreate);
        }

        if (usersToNotifyByPush.length > 0) {
            WebSocketService.sendToUsers(usersToNotifyByPush, {
                title: template.title,
                message: template.message,
                type: template.type
            });
            
            // إرسال Push لجميع المستخدمين في المجموعة (اختياري حسب استهلاك الموارد)
            for (const userId of usersToNotifyByPush) {
                this.sendPushToUser(models, userId, {
                    title: template.title,
                    body: template.message,
                    url: template.actionUrl || '/'
                }).catch(() => {});
            }
        }
    }

    /**
     * إرسال إشعار Web Push حقيقي لجميع أجهزة المستخدم المسجلة
     */
    static async sendPushToUser(models, userId, payload) {
        if (!models) throw new Error('models is required for sendPushToUser');
        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
        
        try {
            const { PushSubscription } = models;
            if (!PushSubscription) return;
            
            const subscriptions = await PushSubscription.find({ user: userId });
            if (!subscriptions || subscriptions.length === 0) return;

            const notificationPayload = JSON.stringify({
                title: payload.title || 'HM CAR',
                body: payload.body || '',
                url: payload.url || '/',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png'
            });

            const pushPromises = subscriptions.map(sub => {
                return webpush.sendNotification(sub.subscription, notificationPayload)
                    .catch(async (err) => {
                        if (err.statusCode === 404 || err.statusCode === 410) {
                            await PushSubscription.findByIdAndDelete(sub._id);
                        }
                    });
            });

            await Promise.all(pushPromises);
        } catch (error) {
            console.error('sendPushToUser error:', error);
        }
    }
}

module.exports = NotificationService;
