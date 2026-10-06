import { useState, useEffect, useRef, useCallback } from 'react';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export interface UseWebSocketOptions {
  onMessage: (message: { type: string; payload: any }) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

export function useWebSocket({ onMessage, onOpen, onClose, onError }: UseWebSocketOptions) {
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);

  // حفظ المراجع لتجنب تكرار الاتصال في React StrictMode
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  });

  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // في بيئة التطوير مع Vite أو الإنتاج
    return `${protocol}//${window.location.host}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    isManuallyClosedRef.current = false;
    setStatus('connecting');

    const url = getWsUrl();
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      if (onOpenRef.current) onOpenRef.current();

      // تفعيل نبضات الاتصال (Ping) كل 15 ثانية للحفاظ على استقرار الشبكة
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') return;
        if (onMessageRef.current) onMessageRef.current(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (onCloseRef.current) onCloseRef.current();

      // محاولة إعادة الاتصال التلقائي إذا لم يتم الإغلاق يدوياً
      if (!isManuallyClosedRef.current) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      }
    };

    ws.onerror = (err) => {
      if (onErrorRef.current) onErrorRef.current(err);
      ws.close();
    };
  }, [getWsUrl]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const send = useCallback((message: { type: string; payload?: any }) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    send,
  };
}
