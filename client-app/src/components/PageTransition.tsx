'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const variants = {
    initial:  { opacity: 0, y: 18, scale: 0.99 },
    animate:  { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
    exit:     { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.2,  ease: 'easeIn' as const } },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ minHeight: '100%' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
