'use client';

/**
 * سياق الاتصال الفوري (SocketContext)
 * يدعم WebSockets فقط إذا كان NEXT_PUBLIC_SOCKET_URL محدداً.
 * في بيئة Vercel Serverless (بدون socket URL)، يعمل التطبيق بشكل طبيعي بدون Socket.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiCache } from './api-cache';

// نستورد Socket فقط عند الحاجة لتجنب الأخطاء في بيئة Vercel
type Socket = import('socket.io-client').Socket;

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isLoggedIn } = useAuth();

    useEffect(() => {
        // تحديد عنوان السوكت — لا نتصل إذا كنا على Vercel بدون URL صريح
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
        
        // إذا لم يكن هناك URL خاص للسوكت، لا نحاول الاتصال
        // هذا يمنع الخطأ 404 على Vercel Serverless
        if (!socketUrl) {
            console.info('[Socket] No NEXT_PUBLIC_SOCKET_URL configured — real-time disabled.');
            return;
        }

        // استيراد socket.io-client ديناميكياً فقط عند الحاجة
        import('socket.io-client').then(({ io }) => {
            const socketInstance = io(socketUrl, {
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 5000,
                reconnectionDelayMax: 15000,
                randomizationFactor: 0.5,
                timeout: 10000,
            });

            socketInstance.on('connect', () => {
                setIsConnected(true);

                if (user?.role === 'admin') {
                    socketInstance.emit('join_room', 'admin_room');
                }
            });

            socketInstance.on('disconnect', () => {
                setIsConnected(false);
            });

            socketInstance.on('connect_error', (err) => {
                console.warn('[Socket] Connection error:', err.message);
                // لا نرفع استثناء — التطبيق يستمر بدون Socket
            });

            // الاستماع للإشعارات الجديدة
            socketInstance.on('new_notification', (data: {
                id?: string;
                title?: string;
                message?: string;
                type?: string;
                actionLabel?: string;
                actionUrl?: string;
            }) => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('hm_smart_alert', {
                        detail: {
                            id: data.id || Math.random().toString(),
                            title: data.title || 'تنبيه جديد',
                            message: data.message || '',
                            type: data.type || 'info',
                            actionLabel: data.actionLabel,
                            onAction: data.actionUrl ? () => { window.location.href = data.actionUrl!; } : undefined,
                        },
                    }));
                }
            });

            // ── Cache Invalidation via WebSocket ──
            // عند إضافة/تعديل/حذف سيارة → مسح كاش السيارات
            socketInstance.on('car:added', () => {
                apiCache.invalidate('/api/v2/cars');
                apiCache.invalidate('/api/v2/analytics');
            });
            socketInstance.on('car:updated', () => {
                apiCache.invalidate('/api/v2/cars');
            });
            socketInstance.on('car:deleted', () => {
                apiCache.invalidate('/api/v2/cars');
                apiCache.invalidate('/api/v2/analytics');
            });
            // عند تغيير حالة طلب → مسح كاش الطلبات والإحصائيات
            socketInstance.on('order:status_changed', () => {
                apiCache.invalidate('/api/v2/orders');
                apiCache.invalidate('/api/v2/analytics');
            });
            // عند تحديث مزاد حي
            socketInstance.on('auction:updated', () => {
                apiCache.invalidate('/api/v2/auctions');
                apiCache.invalidate('/api/v2/live-auctions');
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        }).catch((err) => {
            console.warn('[Socket] Failed to load socket.io-client:', err);
        });
    }, [user?.role]);

    // إرسال حدث User Login عند استقرار الاتصال
    useEffect(() => {
        if (isLoggedIn && user && socket && isConnected) {
            socket.emit('user_login', {
                id: (user as any)._id || (user as any).id,
                name: user.name,
                role: user.role,
                timestamp: new Date(),
            });
        }
    }, [isLoggedIn, user, socket, isConnected]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
