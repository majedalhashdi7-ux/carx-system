'use client';

/**
 * سياق الاتصال الفوري (SocketContext)
 * المسؤول عن إنشاء وإدارة اتصال WebSockets مع الخادم لتلقي الإشعارات والتحديثات الحية.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null; // كائن الاتصال (Socket Instance)
    isConnected: boolean; // هل الاتصال نشط حالياً؟
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null); // حالة كائن السوكت
    const [isConnected, setIsConnected] = useState(false); // حالة الاتصال
    const { user, isLoggedIn } = useAuth(); // جلب بيانات المستخدم لربط الاتصال به

    useEffect(() => {
        // الاتصال بالخادم مع دعم إعادة المحاولة التلقائية (Robust Connection)
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        
        const socketInstance = io(socketUrl, {
            transports: ['polling', 'websocket'], // البدء بـ polling لأنه أصلح لبيئات Serverless مثل Vercel
            reconnection: true,
            reconnectionAttempts: 3,        // إيقاف المحاولات المجنونة التي تسبب اختناق المتصفح (كانت Infinity)
            reconnectionDelay: 5000,        // البدء بـ 5 ثواني لمنح الخادم وقتاً للرد
            reconnectionDelayMax: 15000,    // أقصى تأخير 15 ثانية
            randomizationFactor: 0.5,
            timeout: 10000                  // مهلة الاتصال 10 ثواني (بدلاً من 20 لتقليل التعليق)
        });

        socketInstance.on('connect', () => {
            console.log('✅ Connected to Real-time Server');
            setIsConnected(true);

            // إذا كان المستخدم مديراً (Admin)، ينضم لغرفة الإدارة لتلقي تنبيهات النظام والتحكم
            if (user?.role === 'admin') {
                socketInstance.emit('join_room', 'admin_room');
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Disconnected from Real-time Server');
            setIsConnected(false);
        });

        // الاستماع للإشعارات الجديدة القادمة من الخادم
        socketInstance.on('new_notification', (data: any) => {
            console.log('⚡ New Real-time Notification:', data);
            
            // [[ARABIC_COMMENT]] إرسال حدث مخصص لتشغيل مكون الـ Smart Island في الواجهة لعرض الإشعار للمستخدم
            window.dispatchEvent(new CustomEvent('hm_smart_alert', {
                detail: {
                    id: data.id || Math.random().toString(),
                    title: data.title || 'تنبيه جديد',
                    message: data.message || '',
                    type: data.type || 'info',
                    actionLabel: data.actionLabel,
                    onAction: data.actionUrl ? () => window.location.href = data.actionUrl : undefined
                }
            }));
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user?.role]);

    // إرسال حدث (User Login) عند استقرار الاتصال لتوثيق المستخدم في السوكت
    useEffect(() => {
        if (isLoggedIn && user && socket && isConnected) {
            socket.emit('user_login', {
                id: (user as any)._id || (user as any).id,
                name: user.name,
                role: user.role,
                timestamp: new Date()
            });
        }
    }, [isLoggedIn, user, socket, isConnected]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
