'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Crumb { label: string; href?: string; }

interface StatItem {
    label: string;
    value: string | number;
    color?: string;
}

interface Props {
    title: string;
    titleEn?: string;
    subtitle?: string;
    crumbs?: Crumb[];
    actions?: ReactNode;
    children: ReactNode;
    isRTL?: boolean;
    backHref?: string;
    icon?: LucideIcon;
    accentColor?: 'orange' | 'blue' | 'red' | 'green' | 'purple' | 'amber';
    stats?: StatItem[];
    badge?: string;
}

const ACCENT_CLASSES = {
    orange: {
        glow: 'rgba(249,115,22,0.15)',
        border: 'border-orange-500/20',
        text: 'text-orange-400',
        bg: 'bg-orange-500/10',
        iconBg: 'bg-orange-500/15',
        iconBorder: 'border-orange-500/30',
        gradient: 'from-orange-500/8 via-transparent to-transparent',
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    blue: {
        glow: 'rgba(59,130,246,0.15)',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        bg: 'bg-blue-500/10',
        iconBg: 'bg-blue-500/15',
        iconBorder: 'border-blue-500/30',
        gradient: 'from-blue-500/8 via-transparent to-transparent',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    red: {
        glow: 'rgba(239,68,68,0.15)',
        border: 'border-red-500/20',
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        iconBg: 'bg-red-500/15',
        iconBorder: 'border-red-500/30',
        gradient: 'from-red-500/8 via-transparent to-transparent',
        badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    green: {
        glow: 'rgba(52,211,153,0.15)',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        iconBg: 'bg-emerald-500/15',
        iconBorder: 'border-emerald-500/30',
        gradient: 'from-emerald-500/8 via-transparent to-transparent',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    purple: {
        glow: 'rgba(167,139,250,0.15)',
        border: 'border-purple-500/20',
        text: 'text-purple-400',
        bg: 'bg-purple-500/10',
        iconBg: 'bg-purple-500/15',
        iconBorder: 'border-purple-500/30',
        gradient: 'from-purple-500/8 via-transparent to-transparent',
        badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    amber: {
        glow: 'rgba(251,191,36,0.15)',
        border: 'border-amber-500/20',
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        iconBg: 'bg-amber-500/15',
        iconBorder: 'border-amber-500/30',
        gradient: 'from-amber-500/8 via-transparent to-transparent',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
};

export default function AdminPageShell({
    title, titleEn, subtitle, crumbs = [], actions, children,
    isRTL = true, backHref, icon: Icon, accentColor = 'orange', stats, badge
}: Props) {
    const accent = ACCENT_CLASSES[accentColor];

    return (
        <div className="min-h-screen pb-16">
            {/* ── Premium Page Header ── */}
            <div className={cn(
                'relative px-4 sm:px-6 lg:px-10 pt-6 pb-5 mb-6',
                'border-b border-white/[0.05]',
                `bg-gradient-to-r ${accent.gradient}`,
            )}>
                {/* Breadcrumb */}
                {crumbs.length > 0 && (
                    <nav className="ck-breadcrumb mb-4">
                        <Link href="/admin/dashboard" className="transition-colors hover:text-orange-400/80">
                            HM-CTRL
                        </Link>
                        {crumbs.map((c, i) => (
                            <span key={i} className="flex items-center gap-1">
                                <ChevronRight className="w-3 h-3 ck-breadcrumb-sep opacity-50" />
                                {c.href
                                    ? <Link href={c.href} className="transition-colors hover:text-orange-400/80">{c.label}</Link>
                                    : <span className={accent.text}>{c.label}</span>
                                }
                            </span>
                        ))}
                    </nav>
                )}

                {/* Title row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        {/* Back button */}
                        {backHref && (
                            <Link href={backHref}>
                                <motion.button
                                    whileHover={{ scale: 1.08, x: isRTL ? 3 : -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                    title={isRTL ? 'الرجوع' : 'Back'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", !isRTL && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 18-6-6 6-6"/>
                                    </svg>
                                </motion.button>
                            </Link>
                        )}

                        {/* Page Icon */}
                        {Icon && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className={cn(
                                    'w-12 h-12 rounded-2xl flex items-center justify-center border',
                                    accent.iconBg, accent.iconBorder
                                )}
                            >
                                <Icon className={cn('w-6 h-6', accent.text)} />
                            </motion.div>
                        )}

                        <div>
                            {titleEn && (
                                <p className="cockpit-mono text-[9px] text-white/25 tracking-[0.3em] uppercase mb-1">
                                    {titleEn}
                                </p>
                            )}
                            <div className="flex items-center gap-3">
                                <h1 className="ck-page-title">{title}</h1>
                                {badge && (
                                    <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border', accent.badge)}>
                                        {badge}
                                    </span>
                                )}
                            </div>
                            {subtitle && <p className="ck-page-subtitle mt-0.5">{subtitle}</p>}
                        </div>
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {actions}
                        </div>
                    )}
                </div>

                {/* Stats Strip */}
                {stats && stats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-3 mt-5 flex-wrap"
                    >
                        {stats.map((stat, i) => (
                            <div key={i} className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl border',
                                'bg-white/[0.03] border-white/[0.06]'
                            )}>
                                <span className={cn('text-xl font-black font-mono', stat.color || accent.text)}>
                                    {stat.value}
                                </span>
                                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* ── Page Content ── */}
            <div className="px-4 sm:px-6 lg:px-10">
                {children}
            </div>
        </div>
    );
}
