import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Critical events that must trigger a blocking modal + auth/route change.
const BLOCKING_TYPES = new Set([
  'USER_BANNED_BY_PLATFORM',
  'GROUP_DELETED_BY_PLATFORM',
]);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [blockingEvent, setBlockingEvent] = useState(null);

  const clientRef = useRef(null);

  /* Initial load — pulls history from REST whenever auth flips on. */
  const loadInitial = useCallback(async () => {
    try {
      const [page, count] = await Promise.all([
        notificationService.list({ page: 0, size: 30 }),
        notificationService.unreadCount(),
      ]);
      const list = page.content || [];
      setItems(list);
      setUnreadCount(count);

      // If user was banned / their group deleted while they were offline,
      // the notification is in DB but STOMP never reached them. Surface
      // the most-recent unread blocking event as a modal so the flow
      // still works on refresh (or first login after ban).
      const blocker = list.find(
        (n) => !n.isRead && BLOCKING_TYPES.has(n.type)
      );
      if (blocker) setBlockingEvent(blocker);
    } catch (err) {
      console.warn('[notifications] initial load failed', err);
    }
  }, []);

  /* STOMP connect — runs once per authenticated session. */
  useEffect(() => {
    if (!isAuthenticated) {
      // Tear down on logout
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setItems([]);
      setUnreadCount(0);
      setConnected(false);
      return;
    }

    loadInitial();

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {}, // silence verbose logs
      onConnect: () => {
        setConnected(true);
        client.subscribe('/user/queue/notifications', (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            setItems((prev) => [payload, ...prev]);
            setUnreadCount((c) => c + 1);
            if (BLOCKING_TYPES.has(payload.type)) {
              setBlockingEvent(payload);
            }
          } catch (e) {
            console.warn('[notifications] bad payload', e);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('[notifications] STOMP error', frame.headers?.message);
        setConnected(false);
      },
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('[notifications] markAsRead failed', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[notifications] markAllAsRead failed', err);
    }
  }, []);

  const removeNotification = useCallback(async (id) => {
    try {
      await notificationService.remove(id);
      setItems((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.warn('[notifications] delete failed', err);
    }
  }, []);

  const acknowledgeBlocking = useCallback(() => {
    const ev = blockingEvent;
    setBlockingEvent(null);

    // Mark the blocking notification as read so loadInitial's scan does
    // not re-trigger the modal on every future refresh. For GROUP_DELETED
    // this is the ONLY path that clears the notification — there is no
    // server-side "undelete-group" flow that would do it automatically.
    if (ev && ev.id) {
      notificationService.markAsRead(ev.id).catch((err) => {
        console.warn('[notifications] markAsRead on ack failed', err);
      });
      setItems((prev) =>
        prev.map((n) => (n.id === ev.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    // For USER_BANNED — force logout. For GROUP_DELETED — caller decides
    // navigation based on event.referenceId == current route.
    if (ev && ev.type === 'USER_BANNED_BY_PLATFORM') {
      logout();
      window.location.href = '/login';
    }
    return ev;
  }, [blockingEvent, logout]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      connected,
      blockingEvent,
      markAsRead,
      markAllAsRead,
      removeNotification,
      acknowledgeBlocking,
      refresh: loadInitial,
    }),
    [
      items,
      unreadCount,
      connected,
      blockingEvent,
      markAsRead,
      markAllAsRead,
      removeNotification,
      acknowledgeBlocking,
      loadInitial,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
