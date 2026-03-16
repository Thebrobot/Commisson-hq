import { ExternalLink, Mail, Phone, User } from "lucide-react";
import {
  currency,
  getProductById,
  longDateFormat,
} from "@/lib/commission";
import type { DealFeedItem } from "@/types/commission";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ClientProfileSheetProps {
  item: DealFeedItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientProfileSheet = ({ item, open, onOpenChange }: ClientProfileSheetProps) => {
  if (!item) return null;

  const { deal, rep, summary } = item;
  const productNames = deal.products
    .map((lineItem) => getProductById(lineItem.productId)?.name ?? lineItem.productId)
    .join(", ");
  const isCancelled = deal.status === "cancelled";
  const mrr = isCancelled ? -summary.mrr : summary.mrr;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left">Client profile</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto">
          {/* Client contact info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-semibold text-foreground">{deal.clientName}</p>
                </div>
              </div>
              {deal.clientEmail && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${deal.clientEmail}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {deal.clientEmail}
                    </a>
                  </div>
                </div>
              )}
              {deal.clientPhone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${deal.clientPhone.replace(/\D/g, "")}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {deal.clientPhone}
                    </a>
                  </div>
                </div>
              )}
              {deal.ghlContactId && (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 rounded-lg border border-border bg-secondary/20 px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">Contact URL</p>
                    <a
                      href={`https://app.thebrobot.com/v2/location/nUFqlRRkiJoqpyubsiaD/contacts/detail/${deal.ghlContactId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      View in HighLevel
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rep */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rep
            </h4>
            <p className="font-semibold text-foreground">{rep.name}</p>
          </div>

          {/* Deal summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Commission summary
            </h4>
            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {productNames || "Setup-only deal"}
              </p>
              <p className="text-sm">
                Payout: {longDateFormat.format(summary.payoutDate)}
              </p>
              <p className={`font-mono-tabular font-semibold ${isCancelled ? "text-destructive" : "text-primary"}`}>
                {currency.format(mrr)} MRR
              </p>
              <p className="text-sm text-muted-foreground">
                {currency.format(summary.upfrontCommission)} upfront + {currency.format(summary.setupCommission)} setup
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientProfileSheet;
