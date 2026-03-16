const isoDateTime = (offsetDays: number) => {
  const date = new Date();
  date.setHours(14, 30, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

export const mockNotifications = [
  {
    id: "notif-001",
    type: "new_customer" as const,
    title: "New customer",
    message: "Acme Dental — paid today.",
    createdAt: isoDateTime(-2),
    read: false,
    repId: "rep-you",
    clientName: "Acme Dental",
    dealId: "deal-001",
    href: "/clients",
  },
  {
    id: "notif-002",
    type: "new_customer" as const,
    title: "New customer",
    message: "Sunset Legal — trial until first payment.",
    createdAt: isoDateTime(-5),
    read: true,
    repId: "rep-you",
    clientName: "Sunset Legal",
    dealId: "deal-002",
    href: "/clients",
  },
  {
    id: "notif-003",
    type: "commission_ready" as const,
    title: "Commission ready",
    message: "Acme Dental — $247.50 ready to pay.",
    createdAt: isoDateTime(-1),
    read: false,
    repId: "rep-you",
    clientName: "Acme Dental",
    dealId: "deal-001",
    href: "/clients",
  },
  {
    id: "notif-004",
    type: "commission_paid" as const,
    title: "Commission paid",
    message: "Sunset Legal — payout sent.",
    createdAt: isoDateTime(-3),
    read: true,
    repId: "rep-you",
    clientName: "Sunset Legal",
    dealId: "deal-002",
    href: "/clients",
  },
  {
    id: "notif-005",
    type: "client_cancelled" as const,
    title: "Client cancelled",
    message: "Metro Insurance — account cancelled.",
    createdAt: isoDateTime(-4),
    read: false,
    repId: "rep-marcus",
    clientName: "Metro Insurance",
    dealId: "deal-003",
    href: "/clients",
  },
];
