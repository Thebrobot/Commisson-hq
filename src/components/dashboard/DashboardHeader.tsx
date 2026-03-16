import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, ExternalLink, Flame, Menu, Plus, Settings, UserPlus, X } from "lucide-react";
import SettingsSheet from "@/components/dashboard/SettingsSheet";
import RepAvatar from "@/components/dashboard/RepAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { handoffTools } from "@/data/handoffTools";
import { handoffToolItems, handoffProductColumns } from "@/data/handoffToolbox";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import { useDashboard } from "@/providers/DashboardProvider";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Active Clients", path: "/clients" },
  { label: "Handoff Hub", path: "/handoff" },
  { label: "Bag Calc", path: "/commissions" },
];

const navItemsMobile = [
  { label: "Dashboard", path: "/" },
  { label: "Clients", path: "/clients" },
  { label: "Handoff Hub", path: "/handoff" },
  { label: "Bag Calc", path: "/commissions" },
];

const DashboardHeader = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { reps, selectedRepId, setSelectedRepId } = useDashboard();
  const selectedRep = reps.find((rep) => rep.id === selectedRepId) ?? null;
  const selectedLabel = selectedRepId === "all" ? "Team board" : selectedRep?.name ?? "Rep view";

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      className="flex flex-col gap-2 py-1.5 pb-0.5 sm:flex-row sm:items-center sm:gap-2 sm:py-2 md:gap-3 md:py-2 lg:gap-3 lg:py-2"
    >
      {/* Mobile: Brand + hamburger + utility icons, then Team dropdown */}
      <div className="flex flex-1 flex-col gap-2 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
              <Flame className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Commission<span className="text-primary">HQ</span>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationPanel size="sm" />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)} aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border bg-card/80 text-foreground shadow-sm" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Select dashboard scope"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-left shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {selectedRepId === "all" ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">TM</div>
              ) : selectedRep ? (
                <RepAvatar avatar={selectedRep.avatar} name={selectedRep.name} className="h-9 w-9 rounded-lg" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">HQ</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Viewing</p>
                <p className="truncate text-sm font-semibold text-foreground">{selectedLabel}</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 dark:text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[17rem] rounded-xl border-border bg-card/95 p-2 text-foreground backdrop-blur-xl">
            <DropdownMenuLabel className="px-2 pb-1 pt-0 text-xs uppercase tracking-[0.2em] text-muted-foreground">View Scope</DropdownMenuLabel>
            <DropdownMenuSeparator className="md:col-span-2 mx-0 bg-border" />
            <DropdownMenuRadioGroup value={selectedRepId} onValueChange={setSelectedRepId}>
              <DropdownMenuRadioItem value="all" className="mt-1 rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">TM</div>
                  <p className="text-sm font-semibold">Team board</p>
                </div>
              </DropdownMenuRadioItem>
              {reps.map((rep) => (
                <DropdownMenuRadioItem key={rep.id} value={rep.id} className="rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground">
                  <div className="flex items-center gap-3">
                    <RepAvatar avatar={rep.avatar} name={rep.name} className="h-8 w-8 rounded-lg" />
                    <p className="truncate text-sm font-semibold">{rep.name}</p>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tablet/Desktop: Brand | Centered nav | Fixed right group */}
      <div className="hidden sm:flex min-w-0 flex-1 items-center gap-2 md:gap-3 lg:gap-4">
        {/* Brand - left */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
            <Flame className="h-4 w-4 text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Commission<span className="text-primary">HQ</span>
          </h1>
        </div>

        {/* Centered: nav pills + New Order (xl+ only); hamburger below xl */}
        <div className="flex flex-1 justify-center">
          <nav className="hidden xl:flex flex-nowrap items-center gap-2">
            <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-center text-sm font-semibold snap-transition ${
                      isActive
                        ? "border border-primary/25 bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-secondary/60 hover:text-foreground dark:text-muted-foreground dark:hover:bg-secondary/50 dark:hover:text-foreground"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-2 rounded-xl" aria-label="New order options">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[20rem] rounded-xl border-border bg-card/95 p-2 text-foreground backdrop-blur-xl md:w-auto md:min-w-[36rem] md:grid md:grid-cols-2 md:gap-x-6 md:p-4">
                <DropdownMenuItem className="col-span-2 flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground md:col-span-2" onSelect={() => navigate("/clients", { state: { openNewClient: true } })}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Add client</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Create a new client and add them to your active deals.</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="col-span-2 mx-0 bg-border md:col-span-2" />
                <DropdownMenuLabel className="col-span-2 px-2 pb-1 pt-0 text-xs uppercase tracking-[0.2em] text-muted-foreground md:col-span-2">Tools</DropdownMenuLabel>
                {handoffToolItems.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <DropdownMenuItem key={tool.title} asChild>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{tool.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{tool.description}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="col-span-2 mx-0 bg-border md:col-span-2" />
                <DropdownMenuLabel className="col-span-2 px-2 pb-1 pt-0 text-xs uppercase tracking-[0.2em] text-muted-foreground md:col-span-2">Order links</DropdownMenuLabel>
                {handoffProductColumns.flatMap((col) => col.products).map((product) => {
                  const Icon = product.icon;
                  return (
                    <DropdownMenuItem key={product.id} asChild>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold">{product.name}</p>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="col-span-2 mx-0 bg-border md:col-span-2" />
                <DropdownMenuLabel className="col-span-2 px-2 pb-1 pt-0 text-xs uppercase tracking-[0.2em] text-muted-foreground md:col-span-2">Handoff Hub</DropdownMenuLabel>
                {handoffTools.map((tool) => {
                  const Icon = tool.icon;
                  const isChecklist = tool.title === "Onboard Checklist";
                  return (
                    <DropdownMenuItem key={tool.title} className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground" onSelect={() => { if (isChecklist) navigate("/handoff"); }}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{tool.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="col-span-2 mx-0 bg-border md:col-span-2" />
                <DropdownMenuItem className="col-span-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground focus:bg-secondary/70 focus:text-foreground md:col-span-2" onSelect={() => navigate("/handoff")}>
                  View All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Fixed right: utility icons + Team dropdown + hamburger (tablet) - stays together */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <NotificationPanel size="sm" />
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Select dashboard scope"
                className="flex min-w-0 min-h-10 shrink items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-left shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-w-[6rem] sm:gap-2 md:min-w-[8rem] md:px-3 lg:min-w-[10rem] xl:min-w-[14rem]"
              >
            {selectedRepId === "all" ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                TM
              </div>
            ) : selectedRep ? (
              <RepAvatar
                avatar={selectedRep.avatar}
                name={selectedRep.name}
                className="h-9 w-9 rounded-lg"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                HQ
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Viewing</p>
              <p className="truncate text-sm font-semibold text-foreground">{selectedLabel}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 dark:text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-[17rem] rounded-xl border-border bg-card/95 p-2 text-foreground backdrop-blur-xl"
            >
              <DropdownMenuLabel className="px-2 pb-1 pt-0 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                View Scope
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="md:col-span-2 mx-0 bg-border" />
              <DropdownMenuRadioGroup value={selectedRepId} onValueChange={setSelectedRepId}>
                <DropdownMenuRadioItem
                  value="all"
                  className="mt-1 rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                      TM
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Team board</p>
                    </div>
                  </div>
                </DropdownMenuRadioItem>
                {reps.map((rep) => (
                  <DropdownMenuRadioItem
                    key={rep.id}
                    value={rep.id}
                    className="rounded-lg px-3 py-2.5 focus:bg-secondary/70 focus:text-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <RepAvatar
                        avatar={rep.avatar}
                        name={rep.name}
                        className="h-8 w-8 rounded-lg"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{rep.name}</p>
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden h-11 w-11 rounded-xl border border-border bg-card/80 text-foreground shadow-sm"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="right" className="w-[min(20rem,85vw)] p-0 [&>button]:hidden">
          <div className="flex h-full flex-col">
            <div className="relative flex items-center justify-center border-b border-border p-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-4">
              {navItemsMobile.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-base font-semibold transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary/80"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate("/clients", { state: { openNewClient: true } });
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add client
                </Button>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </motion.header>
  );
};

export default DashboardHeader;
