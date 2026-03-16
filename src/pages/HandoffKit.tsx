import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  Link2,
  MessageCircle,
  Pencil,
} from "lucide-react";
import { handoffToolItems } from "@/data/handoffToolbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/providers/DashboardProvider";
import {
  defaultHandoff,
  HANDOFF_ITEMS,
  handoffProgress,
  isHandoffComplete,
} from "@/lib/handoff";
import { calcDealCommission, getProductById } from "@/lib/commission";
import type { Handoff } from "@/types/commission";
import { toast } from "sonner";

const HandoffKit = () => {
  const reduceMotion = useReducedMotion();
  const { dealId } = useParams<{ dealId: string }>();
  const { deals, reps, updateDeal, selectedRepId } = useDashboard();

  const deal = useMemo(() => deals.find((d) => d.id === dealId), [deals, dealId]);
  const rep = useMemo(() => (deal ? reps.find((r) => r.id === deal.repId) : null), [deal, reps]);

  const [handoff, setHandoff] = useState<Handoff>(defaultHandoff);
  const [portingDocUrl, setPortingDocUrl] = useState("");
  const [isEditingPortingDoc, setIsEditingPortingDoc] = useState(false);

  useEffect(() => {
    if (deal?.handoff) {
      const merged: Handoff = {
        ...defaultHandoff,
        ...deal.handoff,
        checklist: {
          ...defaultHandoff.checklist,
          ...(deal.handoff?.checklist ?? {}),
        },
      };
      setHandoff(merged);
      setPortingDocUrl(merged.portingDocUrl ?? "");
      setIsEditingPortingDoc(false);
    } else {
      setHandoff(defaultHandoff);
      setPortingDocUrl("");
      setIsEditingPortingDoc(false);
    }
  }, [deal?.id, deal?.handoff]);

  const progress = handoffProgress(handoff);
  const complete = isHandoffComplete(handoff);
  const totalItems = HANDOFF_ITEMS.length;
  const progressPct = (progress / totalItems) * 100;

  const updateChecklist = (key: keyof Handoff["checklist"], value: boolean) => {
    const next = {
      ...handoff,
      checklist: { ...handoff.checklist, [key]: value },
    };
    if (value && progress === totalItems - 1) {
      next.completedAt = new Date().toISOString();
    } else if (!value) {
      next.completedAt = null;
    }
    setHandoff(next);
    updateDeal(dealId!, { handoff: next });
  };

  const savePortingDoc = () => {
    const next = {
      ...handoff,
      portingDocUrl: portingDocUrl.trim() || null,
    };
    setHandoff(next);
    updateDeal(dealId!, { handoff: next });
  };

  const discordMessage = useMemo(() => {
    if (!deal) return "";
    const summary = calcDealCommission(deal);
    const planNames = deal.products
      .map((li) => getProductById(li.productId)?.name ?? li.productId)
      .filter(Boolean)
      .join(", ") || "Setup";
    return `NEW BROBOT SALE 🚀
Client: ${deal!.clientName}
Plan: ${planNames}
MRR: $${summary.mrr}
Rep: ${rep?.name ?? ""}`;
  }, [deal, rep]);

  const handleCopyDiscordMessage = async () => {
    const fallbackCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = discordMessage;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "2em";
      ta.style.height = "2em";
      ta.style.padding = "0";
      ta.style.border = "none";
      ta.style.outline = "none";
      ta.style.boxShadow = "none";
      ta.style.background = "transparent";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(discordMessage);
        toast.success("Copied to clipboard");
      } else {
        if (fallbackCopy()) {
          toast.success("Copied to clipboard");
        } else {
          throw new Error("Copy failed");
        }
      }
    } catch {
      if (fallbackCopy()) {
        toast.success("Copied to clipboard");
      } else {
        toast.error("Copy failed – try selecting the text above manually");
      }
    }
  };

  // No dealId: show Handoff Hub landing with client list (user at /handoff)
  if (!dealId) {
    const scopedDeals =
      selectedRepId === "all"
        ? deals.filter((d) => d.status === "active")
        : deals.filter((d) => d.status === "active" && d.repId === selectedRepId);
    const dealItems = scopedDeals
      .map((d) => {
        const r = reps.find((rep) => rep.id === d.repId);
        if (!r) return null;
        return {
          deal: d,
          rep: r,
          progress: handoffProgress(d.handoff ?? defaultHandoff),
          total: HANDOFF_ITEMS.length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);

    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
            <ClipboardCheck className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Handoff Hub
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a client to manage their onboarding checklist and handoff tasks.
          </p>
        </div>

        {dealItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
              <p className="text-sm text-muted-foreground">
                No active clients to manage. Add a client first.
              </p>
              <Button asChild>
                <Link to="/clients" state={{ openNewClient: true }}>
                  Add client
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dealItems.map(({ deal: d, rep: r, progress: p, total }) => (
              <Link
                key={d.id}
                to={`/clients/${d.id}/handoff`}
                className="block rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <p className="font-semibold text-foreground">{d.clientName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r?.name}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={(p / total) * 100} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {p}/{total}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // dealId provided but deal not found (invalid id)
  if (!deal) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-16"
      >
        <p className="text-muted-foreground">Client not found.</p>
        <Button variant="outline" asChild>
          <Link to="/handoff">Back to Handoff Hub</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-24"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to Handoff Hub" asChild>
            <Link to="/handoff">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Handoff Hub
            </h2>
            <p className="text-sm text-muted-foreground">
              {deal.clientName}
              {rep && (
                <span className="ml-1">
                  · {rep.name}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Onboarding Checklist
                </CardTitle>
                <span className="text-sm font-medium text-muted-foreground">
                  {progress}/{totalItems} complete
                </span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {HANDOFF_ITEMS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
                >
                  <Checkbox
                    id={key}
                    checked={handoff.checklist[key]}
                    onCheckedChange={(checked) =>
                      updateChecklist(key, checked === true)
                    }
                  />
                  <Label
                    htmlFor={key}
                    className={`flex-1 cursor-pointer text-sm font-medium ${
                      handoff.checklist[key] ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {label}
                  </Label>
                  {handoff.checklist[key] && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Porting Document
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Link to the signed porting document (e.g. Google Doc, Dropbox). Submit the link here once signed.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {handoff.portingDocUrl && !isEditingPortingDoc ? (
                <div className="flex items-center gap-2">
                  <a
                    href={handoff.portingDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate text-sm text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    {handoff.portingDocUrl}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsEditingPortingDoc(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    Change
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={portingDocUrl}
                    onChange={(e) => setPortingDocUrl(e.target.value)}
                    onBlur={() => {
                      savePortingDoc();
                      if (portingDocUrl.trim()) setIsEditingPortingDoc(false);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      savePortingDoc();
                      setIsEditingPortingDoc(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">
          <Card
            className={
              complete
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
            }
          >
            <CardHeader>
              <CardTitle className="text-base">Handoff Status</CardTitle>
            </CardHeader>
            <CardContent>
              {complete ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Check className="h-7 w-7" strokeWidth={3} />
                  </div>
                  <p className="font-semibold text-primary">Handoff complete</p>
                  <p className="text-sm text-muted-foreground">
                    All requirements are done. This client shows a checkmark on the
                    Active Clients page.
                  </p>
                  {handoff.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed{" "}
                      {new Date(handoff.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {totalItems - progress} item{totalItems - progress !== 1 ? "s" : ""} remaining
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link to="/clients">View Active Clients</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-5 w-5 text-primary" />
                Discord Sale Shoutout
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Copy and paste into the sales channel
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="rounded-lg border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-sans">
                {discordMessage}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleCopyDiscordMessage}
              >
                <Copy className="h-4 w-4" />
                Copy to clipboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="h-5 w-5 text-primary" />
                Port & LOA Forms
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Quick links for port submission and letter of authorization
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {handoffToolItems
                .filter(
                  (t) =>
                    t.title === "Porting Submission Form" ||
                    t.title === "Letter of Authorization"
                )
                .map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <a
                      key={tool.title}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {tool.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default HandoffKit;
