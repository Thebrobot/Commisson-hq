import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, CheckCircle, ClipboardCheck, DollarSign, UserMinus, UserPlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/providers/NotificationProvider";
import type { Notification, NotificationType } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";
import { useDashboard } from "@/providers/DashboardProvider";

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  new_customer: UserPlus,
  commission_ready: CheckCircle,
  commission_paid: DollarSign,
  client_cancelled: UserMinus,
  handoff_needed: ClipboardCheck,
};

function formatTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

function NotificationItem({
  notification,
  repNamePrefix,
  onSelect,
}: {
  notification: Notification;
  repNamePrefix?: string;
  onSelect: () => void;
}) {
  const Icon = typeIcons[notification.type] ?? DollarSign;
  const displayTitle = repNamePrefix ? `${repNamePrefix}: ${notification.title}` : notification.title;

  const content = (
    <div
      className={`flex gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        notification.read
          ? "text-muted-foreground"
          : "bg-primary/5 text-foreground"
      }`}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{displayTitle}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/80">
          {formatTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  if (notification.href) {
    const to =
      notification.dealId && notification.href === "/clients"
        ? { pathname: "/clients", state: { openDealId: notification.dealId } }
        : notification.href;

    return (
      <NavLink
        to={to}
        onClick={onSelect}
        className="block rounded-lg transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:outline-none"
      >
        {content}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-lg text-left transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:outline-none"
    >
      {content}
    </button>
  );
}

interface NotificationPanelProps {
  /** Custom trigger (e.g. bell button). If not provided, uses default Bell icon. */
  trigger?: React.ReactNode;
  /** Size variant for the default trigger. */
  size?: "sm" | "default";
}

export default function NotificationPanel({ trigger, size = "default" }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { reps, selectedRepId, isManagerView } = useDashboard();

  const scopedNotifications = useMemo(() => {
    if (selectedRepId === "all") return notifications;
    return notifications.filter((n) => n.repId === selectedRepId);
  }, [notifications, selectedRepId]);

  const scopedUnreadCount = useMemo(
    () => scopedNotifications.filter((n) => !n.read).length,
    [scopedNotifications],
  );

  const handleSelect = (id: string) => {
    markAsRead(id);
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    scopedNotifications.forEach((n) => markAsRead(n.id));
  };

  const repById = useMemo(() => new Map(reps.map((r) => [r.id, r])), [reps]);

  const defaultTrigger = (
    <Button
      aria-label="View payout alerts"
      variant="ghost"
      size="icon"
      className={`relative text-muted-foreground hover:text-foreground ${
        size === "sm" ? "h-9 w-9" : ""
      }`}
    >
      <motion.span
        className="inline-flex"
        animate={
          scopedUnreadCount > 0 && !prefersReducedMotion
            ? { rotate: [0, -12, 12, -12, 12, 0] }
            : {}
        }
        transition={
          scopedUnreadCount > 0 && !prefersReducedMotion
            ? { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
            : {}
        }
      >
        <Bell className={size === "sm" ? "h-5 w-5" : "h-5 w-5"} />
      </motion.span>
      {scopedUnreadCount > 0 && (
        <span
          aria-hidden="true"
          className={`absolute rounded-full ${
            isManagerView ? "bg-accent" : "bg-primary"
          } ${size === "sm" ? "right-1.5 top-1.5 h-1.5 w-1.5" : "right-2 top-2 h-2 w-2"}`}
        />
      )}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>{trigger ?? defaultTrigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(22rem,90vw)] rounded-xl border-border bg-card/95 p-0 text-foreground shadow-xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {scopedUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[min(18rem,60vh)]">
          <div className="p-2">
            {scopedNotifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {notifications.length === 0
                  ? "No notifications yet"
                  : `No notifications for ${selectedRepId === "all" ? "team" : "this rep"}`}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {scopedNotifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    repNamePrefix={
                      selectedRepId === "all" ? repById.get(n.repId)?.name : undefined
                    }
                    onSelect={() => handleSelect(n.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
