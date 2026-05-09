// [[ARABIC_HEADER]] هذا الملف (modules/socket.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * @file modules/socket.js
 * @description وحدة التحكم في الاتصالات الفورية (WebSockets).
 * تتيح هذه الوحدة إرسال التنبيهات الفورية وتحديثات المزادات بين الخادم والمتصفح.
 * 
 * دعم Multi-Tenant: جميع الغرف (Rooms) معزولة حسب المعرض (Tenant)
 * - كل غرفة مسبوقة بـ tenantId: `${tenantId}_roomName`
 * - مثال: hmcar_admin_room, korean_admin_room
 */

const { Server } = require('socket.io');
const logger = require('./core/logger');

/**
 * فئة إدارة السوكيت (SocketModule)
 * مع دعم العزل بين المعارض (Tenant Isolation)
 */
class SocketModule {
    constructor() {
        this.io = null;
    }

    /**
     * استخراج معرف المعرض (tenantId) من اتصال السوكيت
     * @param {Object} socket - كائن السوكيت
     * @returns {string} معرف المعرض أو 'default' إذا لم يوجد
     */
    _extractTenantId(socket) {
        // الأولوية: auth object > query param > default
        const tenantId = 
            socket.handshake?.auth?.tenantId ||
            socket.handshake?.query?.tenantId ||
            'default';
        return tenantId;
    }

    /**
     * إنشاء اسم غرفة مع بادئة المعرض
     * @param {string} tenantId - معرف المعرض
     * @param {string} roomName - اسم الغرفة الأصلي
     * @returns {string} اسم الغرفة مع البادئة
     */
    _tenantRoom(tenantId, roomName) {
        // إذا كان الاسم مسبوقاً بالفعل بـ tenantId، أعده كما هو
        if (roomName.startsWith(`${tenantId}_`)) {
            return roomName;
        }
        return `${tenantId}_${roomName}`;
    }

    /**
     * التحقق من أن الغرفة تنتمي لنفس المعرض
     * @param {string} tenantId - معرف المعرض
     * @param {string} roomName - اسم الغرفة
     * @returns {boolean} صحيح إذا كانت الغرفة تابعة لنفس المعرض
     */
    _isTenantRoom(tenantId, roomName) {
        return roomName.startsWith(`${tenantId}_`);
    }

    /**
     * تهيئة محرك Socket.io وربطه بخادم HTTP
     * @param {Object} server - خادم HTTP الذي سيعمل عليه السوكيت
     */
    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? (origin, callback) => {
                        const allowed = [
                            'https://hmcar.okigo.net',
                            'https://www.hmcar.okigo.net',
                            'https://hmcar-system-two.vercel.app',
                            'https://client-app-iota-eight.vercel.app',
                            ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
                        ];
                        if (!origin || allowed.includes(origin) || origin.endsWith('.okigo.net')) {
                            callback(null, true);
                        } else {
                            callback(new Error('Not allowed by CORS'));
                        }
                    }
                    : '*',
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // معالجة اتصال بروتوكول Socket
        this.io.on('connection', (socket) => {
            const socketId = socket.id;
            
            // استخراج tenantId من الاتصال وتخزينه في السوكيت
            const tenantId = this._extractTenantId(socket);
            socket.tenantId = tenantId;
            
            logger.info(`🔌 مستخدم جديد متصل: ${socketId} (المعرض: ${tenantId})`);

            // الانضمام التلقائي للغرفة العامة للمعرض
            const tenantGeneralRoom = this._tenantRoom(tenantId, 'general');
            socket.join(tenantGeneralRoom);
            logger.info(`👥 السوكيت ${socketId} انضم تلقائياً إلى الغرفة: ${tenantGeneralRoom}`);

            // حدث الانضمام إلى غرفة (Room) محددة - مع عزل المعرض
            socket.on('join_room', (room) => {
                // إضافة بادئة المعرض إذا لم تكن موجودة
                const prefixedRoom = this._tenantRoom(tenantId, room);
                socket.join(prefixedRoom);
                logger.info(`👥 السوكيت ${socketId} انضم إلى الغرفة: ${prefixedRoom}`);
            });

            // حدث ترك غرفة محددة
            socket.on('leave_room', (room) => {
                const prefixedRoom = this._tenantRoom(tenantId, room);
                socket.leave(prefixedRoom);
                logger.info(`🚪 السوكيت ${socketId} غادر الغرفة: ${prefixedRoom}`);
            });

            // حدث تسجيل دخول المستخدم - يتم إبلاغ لوحة تحكم الإدارة فوراً
            socket.on('user_login', (userData) => {
                logger.info(`🔑 دخول المستخدم: ${userData.name}`);
                const adminRoom = this._tenantRoom(tenantId, 'admin_room');
                this.io.to(adminRoom).emit('admin_notification', {
                    type: 'USER_LOGIN',
                    title: 'تنبيه دخول',
                    message: `العميل ${userData.name} دخل المنصة حالياً.`,
                    data: userData,
                    tenantId: tenantId,
                    timestamp: new Date()
                });
            });

            // تتبع مسار تصفح العميل (Real-time Tracking) لإظهاره للأدمن
            socket.on('user_navigation', (data) => {
                const adminRoom = this._tenantRoom(tenantId, 'admin_room');
                this.io.to(adminRoom).emit('admin_notification', {
                    type: 'USER_NAV',
                    title: 'نشاط تصفح',
                    message: `العميل ${data.userName} يشاهد الآن: ${data.page}`,
                    data: data,
                    tenantId: tenantId,
                    timestamp: new Date()
                });
            });

            // تسجيل نشاط المستخدم (النبضات/التتبع)
            socket.on('user_active', async (userId) => {
                try {
                    if (userId) {
                        socket.userId = userId;
                        const User = require('../models/User');
                        await User.findByIdAndUpdate(userId, { isOnline: true, lastActiveAt: new Date() });
                        logger.info(`👤 تفعيل حالة متصل للمستخدم ID: ${userId}`);
                        
                        const adminRoom = this._tenantRoom(tenantId, 'admin_room');
                        this.io.to(adminRoom).emit('admin_notification', {
                            type: 'USER_ONLINE',
                            title: 'تغيير حالة',
                            message: 'مستخدم أصبح متصلاً الآن.',
                            tenantId: tenantId,
                            timestamp: new Date()
                        });
                    }
                } catch (e) {
                    logger.error('Error updating user active status:', e);
                }
            });

            // معالجة قطع الاتصال
            socket.on('disconnect', async () => {
                logger.info(`🔌 قطع اتصال المستخدم: ${socketId}`);
                if (socket.userId) {
                    try {
                        const User = require('../models/User');
                        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastActiveAt: new Date() });
                        logger.info(`💤 تغيير الحالة لغير متصل للمستخدم ID: ${socket.userId}`);
                        
                        const adminRoom = this._tenantRoom(tenantId, 'admin_room');
                        this.io.to(adminRoom).emit('admin_notification', {
                            type: 'USER_OFFLINE',
                            title: 'تغيير حالة',
                            message: 'مستخدم غادر النظام الآن.',
                            tenantId: tenantId,
                            timestamp: new Date()
                        });
                    } catch (e) {
                        logger.error('Error updating user offline status:', e);
                    }
                }
            });
        });

        logger.info('✅ تم تفعيل خدمة التحديثات الفورية (Socket.io) مع دعم Multi-Tenant');
        
        // تعيين global.io للتوافق مع الكود القديم (مثل UserNotification.js)
        global.io = this.io;
        
        return this.io;
    }

    /**
     * الحصول على كائن io للاستخدام الخارجي
     * @returns {Object|null} كائن Socket.io
     */
    getIO() {
        return this.io;
    }

    /**
     * إرسال بيانات (Emit) إلى غرفة معينة بشكل مباشر
     * @param {string} room - اسم الغرفة (بدون بادئة المعرض)
     * @param {string} event - اسم الحدث
     * @param {Object} data - البيانات المرسلة
     * @param {string} [tenantId] - معرف المعرض (اختياري، يستخدم 'default' إذا لم يحدد)
     */
    emitToRoom(room, event, data, tenantId = 'default') {
        if (this.io) {
            const prefixedRoom = this._tenantRoom(tenantId, room);
            this.io.to(prefixedRoom).emit(event, data);
        }
    }

    /**
     * إرسال بيانات إلى غرفة مخصصة للمعرض (Tenant-scoped room)
     * هذا هو الأسلوب المفضل للإرسال من خارج السوكيت
     * @param {string} tenantId - معرف المعرض
     * @param {string} room - اسم الغرفة (بدون بادئة المعرض)
     * @param {string} event - اسم الحدث
     * @param {Object} data - البيانات المرسلة
     */
    emitToTenantRoom(tenantId, room, event, data) {
        if (this.io) {
            const prefixedRoom = this._tenantRoom(tenantId, room);
            this.io.to(prefixedRoom).emit(event, data);
            logger.info(`📤 إرسال إلى الغرفة: ${prefixedRoom} - الحدث: ${event}`);
        }
    }

    /**
     * إرسال بيانات (Broadcast) لجميع المستخدمين المتصلين في معرض معين
     * @param {string} event - اسم الحدث
     * @param {Object} data - البيانات المرسلة
     * @param {string} [tenantId] - معرف المعرض (اختياري، يستخدم 'default' إذا لم يحدد)
     */
    broadcast(event, data, tenantId = 'default') {
        if (this.io) {
            const tenantGeneralRoom = this._tenantRoom(tenantId, 'general');
            this.io.to(tenantGeneralRoom).emit(event, data);
        }
    }

    /**
     * إرسال بيانات لجميع المستخدمين المتصلين في جميع المعارض
     * استخدام بحذر - فقط للإشعارات النظامية العامة
     * @param {string} event - اسم الحدث
     * @param {Object} data - البيانات المرسلة
     */
    broadcastGlobal(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    /**
     * إرسال إشعار لمدراء معرض معين
     * @param {string} tenantId - معرف المعرض
     * @param {Object} notification - بيانات الإشعار
     */
    notifyAdmins(tenantId, notification) {
        this.emitToTenantRoom(tenantId, 'admin_room', 'admin_notification', {
            ...notification,
            tenantId: tenantId,
            timestamp: notification.timestamp || new Date()
        });
    }

    /**
     * إرسال إشعار لمستخدم محدد في معرض معين
     * @param {string} tenantId - معرف المعرض
     * @param {string} userId - معرف المستخدم
     * @param {string} event - اسم الحدث
     * @param {Object} data - البيانات المرسلة
     */
    emitToUser(tenantId, userId, event, data) {
        if (this.io) {
            const userRoom = this._tenantRoom(tenantId, `user_${userId}`);
            this.io.to(userRoom).emit(event, data);
        }
    }
}

// تصدير نسخة واحدة من الوحدة (Singleton)
module.exports = new SocketModule();
