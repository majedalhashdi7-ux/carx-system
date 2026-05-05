'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('⚠️ [CRITICAL ERROR] Caught by boundary:', error, errorInfo);
    // Here you would typically send to Sentry or another logging service
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
    if (typeof window !== 'undefined') {
        window.location.reload(); // Refresh to clean state
    }
  };

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultFallback;
      return <Fallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * تصميم مودرن وفخم لواجهة الخطأ
 */
function DefaultFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 selection:bg-red-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl text-center"
      >
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>

        <h2 className="text-3xl font-black mb-4 tracking-tight uppercase italic">
            Oops! System Interruption
        </h2>
        
        <p className="text-white/60 mb-8 leading-relaxed">
            نعتذر، حدث خطأ غير متوقع في معالجة الطلب. <br />
            فريق التقنية لدينا يعمل على إصلاح المشكلة حالياً.
        </p>

        {error && (
          <div className="mb-8 text-start">
            <details className="group">
              <summary className="cursor-pointer text-xs font-bold text-white/30 uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors list-none flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Technical Details
              </summary>
              <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] text-red-400/80 overflow-x-auto">
                {error.stack || error.message}
              </div>
            </details>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetError}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-white/90 transition-all"
            >
                <RefreshCw className="w-4 h-4" />
                Retry
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-white/10 transition-all"
            >
                <Home className="w-4 h-4" />
                Home
            </motion.button>
        </div>

        <p className="mt-8 text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
            CAR X SYSTEM • ERROR BOUNDARY
        </p>
      </motion.div>
    </div>
  );
}

export default ErrorBoundary;