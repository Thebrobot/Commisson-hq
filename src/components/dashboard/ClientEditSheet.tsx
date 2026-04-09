import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, ClipboardCheck, CreditCard, ExternalLink, Mail, Phone, Plus, Trash2, User } from "lucide-react";
import {
  calcDealCommission,
  currency,
  getProductById,
  getSetupFeeById,
  longDateFormat,
} from "@/lib/commission";
import { productCatalog, setupFeeCatalog } from "@/data/catalog/commission";
import { handoffProductColumns } from "@/data/handoffToolbox";
import type {
  Deal,
  DealFeedItem,
  DealProductLineItem,
  DealSetupFeeLineItem,
  Rep,
} from "@/types/commission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientEditSheetProps {
  item: DealFeedItem | null;
  reps: Rep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dealId: string, updates: Partial<Deal>) => void;
  onCancelDeal?: (dealId: string) => void | Promise<void>;
  onDelete?: (dealId: string) => void | Promise<void>;
}

const ClientEditSheet = ({
  item,
  reps,
  open,
  onOpenChange,
  onSave,
  onCancelDeal,
  onDelete,
}: ClientEditSheetProps) => {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [ghlContactId, setGhlContactId] = useState("");
  const [repId, setRepId] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [firstPaymentDate, setFirstPaymentDate] = useState("");
  const [products, setProducts] = useState<DealProductLineItem[]>([]);
  const [setupFees, setSetupFees] = useState<DealSetupFeeLineItem[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setClientName(item.deal.clientName);
      setClientEmail(item.deal.clientEmail ?? "");
      setClientPhone(item.deal.clientPhone ?? "");
      setGhlContactId(item.deal.ghlContactId ?? "");
      setRepId(item.deal.repId);
      setCloseDate(item.deal.closeDate);
      setFirstPaymentDate(item.deal.firstPaymentDate ?? "");
      setNotes(item.deal.notes ?? "");
      setProducts(
        item.deal.products.length > 0
          ? item.deal.products.map((p) => ({
              productId: p.productId,
              quantity: p.quantity,
              overrideMrr: p.overrideMrr,
            }))
          : [{ productId: "", quantity: 1, overrideMrr: null }],
      );
      setSetupFees(
        item.deal.setupFees.length > 0
          ? item.deal.setupFees.map((s) => ({
              type: s.type,
              actualAmount: s.actualAmount,
            }))
          : [{ type: "", actualAmount: 0 }],
      );
    }
  }, [item]);

  if (!item) return null;

  const { deal } = item;

  const tempDeal: Deal = {
    ...deal,
    clientName: clientName || deal.clientName,
    repId: repId || deal.repId,
    closeDate: closeDate || deal.closeDate,
    firstPaymentDate: firstPaymentDate.trim() || null,
    products: products.filter((p) => p.productId).map((p) => ({
      productId: p.productId,
      quantity: Math.max(p.quantity || 1, 1),
      overrideMrr: p.overrideMrr != null && p.overrideMrr > 0 ? p.overrideMrr : null,
    })),
    setupFees: setupFees.filter((s) => s.type && s.actualAmount > 0).map((s) => ({
      type: s.type,
      actualAmount: s.actualAmount,
    })),
  };

  const summary = calcDealCommission(tempDeal);
  const isCancelled = deal.status === "cancelled";
  const mrr = isCancelled ? -summary.mrr : summary.mrr;

  const addProduct = () => {
    setProducts((prev) => [...prev, { productId: "", quantity: 1, overrideMrr: null }]);
  };

  const updateProduct = (index: number, updates: Partial<DealProductLineItem>) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  const removeProduct = (index: number) => {
    setProducts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const addSetupFee = () => {
    setSetupFees((prev) => [...prev, { type: "", actualAmount: 0 }]);
  };

  const updateSetupFee = (index: number, updates: Partial<DealSetupFeeLineItem>) => {
    setSetupFees((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    );
  };

  const removeSetupFee = (index: number) => {
    setSetupFees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(deal.id, {
      clientName: clientName.trim() || deal.clientName,
      clientEmail: clientEmail.trim() || null,
      clientPhone: clientPhone.trim() || null,
      ghlContactId: ghlContactId.trim() || null,
      repId: repId || deal.repId,
      closeDate: closeDate || deal.closeDate,
      firstPaymentDate: firstPaymentDate.trim() || null,
      notes: notes.trim() || null,
      products: products.filter((p) => p.productId).map((p) => ({
        productId: p.productId,
        quantity: Math.max(p.quantity || 1, 1),
        overrideMrr:
          p.overrideMrr != null && p.overrideMrr > 0 ? p.overrideMrr : null,
      })),
      setupFees: setupFees
        .filter((s) => s.type && s.actualAmount > 0)
        .map((s) => ({ type: s.type, actualAmount: s.actualAmount })),
    });
    onOpenChange(false);
  };

  const handleCancelDeal = async () => {
    if (!onCancelDeal || !confirm("Mark this deal as cancelled? The row will remain but the status will change to cancelled.")) {
      return;
    }
    await onCancelDeal(deal.id);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("Permanently delete this deal? This cannot be undone.")) {
      return;
    }
    await onDelete(deal.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col overflow-hidden w-full max-w-full sm:h-screen sm:max-h-screen sm:w-[min(95vw,1400px)] sm:max-w-[min(95vw,1400px)]"
      >
        <SheetHeader>
          <SheetTitle className="text-left">Edit client</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex shrink-0">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link to={`/clients/${deal.id}/handoff`} onClick={() => onOpenChange(false)}>
              <ClipboardCheck className="h-4 w-4" />
              Handoff
            </Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-1 flex-col overflow-y-auto pl-8 pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pb-4 items-start">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              {/* Contact */}
              <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="client-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="client-phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-id">Contact ID</Label>
                <Input
                  id="contact-id"
                  value={ghlContactId}
                  onChange={(e) => setGhlContactId(e.target.value)}
                  placeholder="GHL contact ID"
                  className="font-mono"
                />
              </div>
              {ghlContactId.trim() && (
                <div className="space-y-2">
                  <Label>Contact URL</Label>
                  <a
                    href={`https://app.thebrobot.com/v2/location/nUFqlRRkiJoqpyubsiaD/contacts/detail/${ghlContactId.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2.5 text-sm font-medium text-primary hover:bg-secondary/40 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    View in HighLevel
                  </a>
                </div>
              )}

              {/* Stripe Payment Links */}
              {(() => {
                const dealProductIds = new Set(products.map((p) => p.productId).filter(Boolean));
                const matchedLinks = handoffProductColumns
                  .flatMap((col) => col.products)
                  .filter((p) => dealProductIds.has(p.id));
                if (matchedLinks.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Charge Customer
                    </Label>
                    <div className="flex flex-col gap-2">
                      {matchedLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 shrink-0" />
                          Charge via Stripe — {link.name}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-auto" />
                        </a>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Opens Stripe checkout in a new tab.</p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Rep & Close date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rep</Label>
              <Select value={repId || undefined} onValueChange={setRepId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rep" />
                </SelectTrigger>
                <SelectContent modal={false} position="popper" className="z-[100]">
                  {reps.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-date">Close date</Label>
              <Input
                id="close-date"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="first-payment-date">
              First payment date <span className="text-muted-foreground">(optional, trial until this date)</span>
            </Label>
            <Input
              id="first-payment-date"
              type="date"
              value={firstPaymentDate}
              onChange={(e) => setFirstPaymentDate(e.target.value)}
              placeholder="Leave blank if no trial"
            />
          </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-6">
          {/* Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Products (MRR)
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={addProduct}
              >
                <Plus className="h-3.5 w-3.5" />
                Add product
              </Button>
            </div>
            <div className="space-y-3">
              {products.map((line, index) => {
                const product = line.productId
                  ? getProductById(line.productId)
                  : null;
                const defaultMrr = product?.commissionableMrr ?? 0;
                const perUnit = product?.perUnit ?? false;

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/10 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Select
                        value={line.productId}
                        onValueChange={(v) =>
                          updateProduct(index, {
                            productId: v,
                            overrideMrr: null,
                          })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productCatalog.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({currency.format(p.commissionableMrr)}
                              {p.perUnit ? "/unit" : ""})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeProduct(index)}
                        aria-label="Remove product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {line.productId && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity || 1}
                            onChange={(e) =>
                              updateProduct(index, {
                                quantity: Math.max(
                                  1,
                                  parseInt(e.target.value, 10) || 1,
                                ),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            MRR {perUnit ? "(per unit)" : ""} — default{" "}
                            {currency.format(defaultMrr)}
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder={currency.format(defaultMrr)}
                            value={
                              line.overrideMrr != null && line.overrideMrr > 0
                                ? String(line.overrideMrr)
                                : ""
                            }
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              updateProduct(index, {
                                overrideMrr:
                                  !Number.isNaN(v) && v > 0 ? v : null,
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Setup fees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Setup fees
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={addSetupFee}
              >
                <Plus className="h-3.5 w-3.5" />
                Add setup fee
              </Button>
            </div>
            <div className="space-y-3">
              {setupFees.map((fee, index) => {
                const feeConfig = fee.type
                  ? getSetupFeeById(fee.type)
                  : null;

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/10 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Select
                        value={fee.type}
                        modal={false}
                        onValueChange={(v) => {
                          const config = getSetupFeeById(v);
                          updateSetupFee(index, {
                            type: v,
                            actualAmount: config?.price ?? fee.actualAmount,
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select setup fee" />
                        </SelectTrigger>
                        <SelectContent>
                          {setupFeeCatalog.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} —{" "}
                              {s.isVariable
                                ? "variable"
                                : currency.format(s.price)}
                              {" "}({s.commissionRate * 100}% comm.)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative z-10 h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeSetupFee(index);
                        }}
                        aria-label="Remove setup fee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {fee.type && (
                      <div className="space-y-1">
                        <Label className="text-xs">Actual amount</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={fee.actualAmount || ""}
                          onChange={(e) =>
                            updateSetupFee(index, {
                              actualAmount: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder={
                            feeConfig?.price
                              ? currency.format(feeConfig.price)
                              : "0"
                          }
                        />
                        {feeConfig && fee.actualAmount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Commission:{" "}
                            {currency.format(
                              fee.actualAmount * feeConfig.commissionRate,
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="client-notes">Internal Notes</Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this client, deal details, or follow-ups..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Live commission summary */}
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Commission summary
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">MRR</span>
                <span
                  className={`font-mono-tabular font-semibold ${
                    isCancelled ? "text-destructive" : "text-primary"
                  }`}
                >
                  {currency.format(mrr)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Upfront</span>
                <span className="font-mono-tabular">
                  {currency.format(summary.upfrontCommission)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Setup</span>
                <span className="font-mono-tabular">
                  {currency.format(summary.setupCommission)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="font-mono-tabular text-primary">
                  {currency.format(summary.totalCommission)}
                </span>
              </div>
              {repId && !isCancelled && (
                <p className="text-xs font-medium text-primary">
                  {currency.format(summary.totalCommission)} will be paid to {reps.find((r) => r.id === repId)?.name ?? "—"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Payout: {longDateFormat.format(summary.payoutDate)}
              </p>
            </div>
          </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6 shrink-0 flex-row flex-wrap gap-2">
          <div className="flex gap-2 mr-auto">
            {onCancelDeal && !isCancelled && (
              <Button
                variant="ghost"
                className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-500 dark:hover:bg-amber-500/10"
                onClick={handleCancelDeal}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel deal
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete deal
              </Button>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={isCancelled}>Save changes</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ClientEditSheet;
