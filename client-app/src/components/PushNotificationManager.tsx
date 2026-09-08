'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api-original';

/**
 * مدير إشعارات الـ Push لنظام PWA
 * يقوم بطلب الصلاحية وتسجيل اشتراك الجهاز في الخلفية
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY ||
    'BNghi5tZPhPvYdmdEEPQPn6M5xuonh0cUsBRpdKjPsy1a9MusGgJuVFZcaE_-t38LfJmeHdIznWWQKfjuUviRVc';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        buffer[i] = rawData.charCodeAt(i);
    }
    return buffer.buffer;
}

async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
        const deviceInfo = {
            browser: navigator.userAgent,
            os: navigator.platform,
            deviceId: localStorage.getItem('hm_device_id') || `web-${Date.now()}`,
        };
        await api.notifications.subscribePush(subscription, deviceInfo);
    } catch (error) {
        console.error('[Push] Failed to sync subscription with backend:', error);
    }
}

async function requestAndSubscribe(registration: ServiceWorkerRegistration): Promise<void> {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.info('[Push] Permission denied by user');
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await sendSubscriptionToBackend(subscription);
        console.info('[Push] ✅ Subscribed successfully');
    } catch (error) {
        console.error('[Push] Subscribe failed:', error);
    }
}

async function initPush(): Promise<void> {
    if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
    ) {
        console.info('[Push] Push notifications not supported in this browser');
        return;
    }

    // التحقق من تسجيل دخول المستخدم
    const userStr = localStorage.getItem('hm_user');
    if (!userStr) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();

        if (existingSub) {
            // تحديث بيانات الاشتراك في كل مرة لضمان مزامنة التوكين مع الخادم
            await sendSubscriptionToBackend(existingSub);
        } else {
            // اشتراك جديد بعد تأخير بسيط لضمان استقرار باقي الكومبوننتس
            await requestAndSubscribe(registration);
        }
    } catch (error) {
        console.error('[Push] Initialization failed:', error);
    }
}

export default function PushNotificationManager() {
    useEffect(() => {
        // تأخير 5 ثوان لضمان استقرار باقي الكومبوننتس وتسجيل السرفيس ووركر
        const timeoutId = setTimeout(initPush, 5000);
        return () => clearTimeout(timeoutId);
    }, []);

    // هذا الكومبوننت لا يظهر شيئاً في الواجهة، يعمل في الخلفية فقط
    return null;
}
