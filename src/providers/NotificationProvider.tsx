import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockNotifications } from "@/data/mockNotifications";
import type { Notification } from "@/types/notification";
import { useDashboard } from "@/providers/DashboardProvider";
import { defaultHandoff, HANDOFF_ITEMS, handoffProgress, isHandoffComplete } from "@/lib/handoff";

const STORAGE_KEY = "commission-notifications-read";

const validIds = new Set(mockNotifications.map((n) => n.id));

function getReadIds(): Set<string> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored) as string[];
    const ids = Array.isArray(parsed) ? parsed : [];
    return new Set(ids.filter((id) => validIds.has(id) || id.startsWith("handoff-")));
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage may be disabled (e.g. private mode)
  }
}

function buildHandoffNotifications(deals: { id: string; repId: string; clientName: string; handoff?: { checklist?: unknown } | null }[]): Notification[] {
  const now = new Date().toISOString();
  return deals
    .filter((d) => !isHandoffComplete(d.handoff ?? defaultHandoff))
    .map((deal) => {
      const progress = handoffProgress(deal.handoff ?? defaultHandoff);
      return {
        id: `handoff-${deal.id}`,
        type: "handoff_needed" as const,
        title: "Handoff incomplete",
        message: `${deal.clientName} — ${progress}/${HANDOFF_ITEMS.length} complete`,
        createdAt: now,
        read: false,
        repId: deal.repId,
        clientName: deal.clientName,
        dealId: deal.id,
        href: `/clients/${deal.id}/handoff`,
      };
    });
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [readIds, setReadIdsState] = useState<Set<string>>(() => getReadIds());
  const { deals } = useDashboard();

  const handoffNotifications = useMemo(
    () => buildHandoffNotifications(deals.filter((d) => d.status === "active")),
    [deals],
  );

  const notifications = useMemo(() => {
    const mock = mockNotifications.map((n) => ({
      ...n,
      read: readIds.has(n.id),
    }));
    const handoff = handoffNotifications.map((n) => ({
      ...n,
      read: readIds.has(n.id),
    }));
    return [...handoff, ...mock];
  }, [readIds, handoffNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAsRead = useCallback((id: string) => {
    setReadIdsState((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = new Set([
      ...mockNotifications.map((n) => n.id),
      ...handoffNotifications.map((n) => n.id),
    ]);
    persistReadIds(allIds);
    setReadIdsState(allIds);
  }, [handoffNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
