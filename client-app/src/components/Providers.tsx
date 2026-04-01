'use client';

/**
 * مزودي الخدمات العامين (Global Providers)
 * يقوم هذا المكون بتغليف التطبيق بجميع الـ React Contexts اللازمة مثل:
 * اللغة، الإعدادات، التنبيهات، واجهة المستخدم، المصادقة، والاتصال المباشر (Socket).
 * كما يقوم بتشغيل خدمات الـ PWA والتنبيهات المنبثقة.
 */

import { ReactNode } from 'react';
import { TenantProvider } from '@/lib/TenantContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import { SocketProvider } from '@/lib/SocketContext';
import { SettingsProvider } from '@/lib/SettingsContext';
import { ToastProvider } from '@/lib/ToastContext';
import { UIProvider } from '@/lib/UIContext';
import PWAUpdater from './PWAUpdater';
import PushNotificationManager from './PushNotificationManager';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <TenantProvider>
            <LanguageProvider>
                <SettingsProvider>
                    <ToastProvider>
                        <UIProvider>
                            <AuthProvider>
                                <SocketProvider>
                                    <PWAUpdater />
                                    <PushNotificationManager />
                                    {children}
                                </SocketProvider>
                            </AuthProvider>
                        </UIProvider>
                    </ToastProvider>
                </SettingsProvider>
            </LanguageProvider>
        </TenantProvider>
    );
}
