'use client';
/**
 * useAuctionSocket — يربط صفحة المزاد بـ Socket.io في الـ Server
 * يستقبل: bid:new, auction:update, timer_update
 * يتولى: reconnect تلقائي، cleanup عند unmount
 */
import { useEffect, useRef, useCallback } from 'react';

type AuctionSocketOptions = {
  auctionId: string;
  token?: string;
  onBidNew?: (data: any) => void;
  onAuctionUpdate?: (data: any) => void;
  onTimerUpdate?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function useAuctionSocket(opts: AuctionSocketOptions) {
  const socketRef = useRef<any>(null);
  const { auctionId, token, onBidNew, onAuctionUpdate, onTimerUpdate, onConnect, onDisconnect } = opts;

  const connect = useCallback(async () => {
    try {
      // Dynamic import لتجنب مشاكل SSR
      const { io } = await import('socket.io-client');

      const serverUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4001') : 'http://localhost:4001');

      const socket = io(serverUrl, {
        auth: token ? { token } : undefined,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        // الانضمام لغرفة المزاد
        socket.emit('join_room', `auction_${auctionId}`);
        onConnect?.();
      });

      socket.on('disconnect', () => onDisconnect?.());
      socket.on('bid:new',        (data: any) => onBidNew?.(data));
      socket.on('bid_update',     (data: any) => onBidNew?.(data));
      socket.on('auction:update', (data: any) => onAuctionUpdate?.(data));
      socket.on('timer_update',   (data: any) => onTimerUpdate?.(data));

      socketRef.current = socket;
    } catch (err) {
      // لا يوقف الصفحة إذا فشل الاتصال
      console.warn('[AuctionSocket] Failed to connect:', err);
    }
  }, [auctionId, token, onBidNew, onAuctionUpdate, onTimerUpdate, onConnect, onDisconnect]);

  useEffect(() => {
    if (!auctionId) return;
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room', `auction_${auctionId}`);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [auctionId, connect]);

  return socketRef;
}
