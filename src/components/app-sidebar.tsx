"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanBarcode,
  Receipt,
  Boxes,
  Users,
  Truck,
  Wallet,
  LineChart,
  Building2,
  Package,
  Images,
  CalendarClock,
  Fingerprint,
  Bell,
  BellRing,
  MessageSquare,
  QrCode,
  ShoppingBag,
  BadgeCheck,
  Calculator,
  BookOpen,
  Scale,
  FileText,
  Landmark,
  Coins,
  BookMarked,
  UserRound,
  UsersRound,
  BadgeDollarSign,
  ShieldCheck,
  Briefcase,
  RefreshCw,
  CreditCard,
  Store,
  UserCog,
  Settings,
} from "lucide-react";

import { HexMark } from "@/components/brand-mark";
import { useActiveModules } from "@/components/modules-provider";
import { SignOutButton } from "@/components/sign-out-button";
import type { ModuleKey } from "@/lib/modules";
import { meetsPlanTier, type PlanKey } from "@/lib/plans";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Role = "super" | "admin" | "manager" | "staff";
/**
 * `module: undefined` marks a Core System screen — never gated by
 * subscription. `multiBranchOnly` hides a screen for single-branch
 * businesses. `minPlan` reserves a screen for a plan tier above what its
 * `module` alone would grant — e.g. Remote Orders needs the Sales module
 * (present from Starter) *and* at least the Retail plan, since it's a
 * growth-stage feature bundled into Sales rather than a module of its own.
 * Only applies to businesses actually on a package (see meetsPlanTier).
 */
type NavItem = {
  title: string;
  url: string;
  icon: typeof Boxes;
  roles: Role[];
  module?: ModuleKey;
  multiBranchOnly?: boolean;
  minPlan?: PlanKey;
};

const SUPER_ONLY: Role[] = ["super"];

// A super account runs the platform, not a business — it never operates a
// till, sells a product, or manages a single business's payroll. These
// exclude "super" so those sections don't show up for it at all.
const TENANT_ALL: Role[] = ["admin", "manager", "staff"];
const TENANT_MANAGER_UP: Role[] = ["admin", "manager"];

const operate: NavItem[] = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { title: "Terminal", url: "/pos", icon: ScanBarcode, roles: TENANT_ALL, module: "pos" },
  { title: "Sales", url: "/sales", icon: Receipt, roles: TENANT_ALL, module: "sales" },
  { title: "Remote orders", url: "/remote-orders", icon: ShoppingBag, roles: TENANT_ALL, module: "sales", minPlan: "retail" },
  { title: "QR scanner", url: "/qr-scanner", icon: QrCode, roles: TENANT_ALL, module: "pos", minPlan: "retail" },
  { title: "Payment proofs", url: "/payment-proofs", icon: BadgeCheck, roles: TENANT_MANAGER_UP, module: "sales", minPlan: "retail" },
  { title: "Till management", url: "/till-management", icon: Coins, roles: TENANT_MANAGER_UP, module: "pos", minPlan: "retail" },
  { title: "Receipt preview", url: "/receipt-preview", icon: FileText, roles: TENANT_ALL, module: "pos" },
];

const stock: NavItem[] = [
  { title: "Products", url: "/products", icon: Package, roles: TENANT_ALL, module: "inventory" },
  { title: "Inventory", url: "/inventory", icon: Boxes, roles: TENANT_MANAGER_UP, module: "inventory" },
  { title: "Edit product", url: "/edit-product", icon: UserCog, roles: TENANT_MANAGER_UP, module: "inventory" },
  { title: "Product images", url: "/product-images", icon: Images, roles: TENANT_MANAGER_UP, module: "inventory" },
  { title: "Expiry tracking", url: "/expiry", icon: CalendarClock, roles: TENANT_MANAGER_UP, module: "inventory" },
  { title: "Suppliers", url: "/suppliers", icon: Truck, roles: TENANT_MANAGER_UP, module: "procurement" },
];

const people: NavItem[] = [
  { title: "Customers", url: "/customers", icon: Users, roles: TENANT_ALL, module: "customers" },
  { title: "Customer file", url: "/customer-file", icon: FileText, roles: TENANT_ALL, module: "customers" },
  { title: "Debtor payment", url: "/debtor-payment", icon: BadgeDollarSign, roles: TENANT_ALL, module: "customers" },
  { title: "Attendance", url: "/attendance", icon: Fingerprint, roles: TENANT_ALL, module: "attendance" },
  { title: "Employees", url: "/employees", icon: UsersRound, roles: TENANT_MANAGER_UP, module: "hr" },
  { title: "Employee record", url: "/employee", icon: UserRound, roles: TENANT_MANAGER_UP, module: "hr" },
  { title: "Payroll", url: "/payroll", icon: Wallet, roles: TENANT_MANAGER_UP, module: "payroll" },
  { title: "Payslip", url: "/payslip", icon: FileText, roles: TENANT_ALL, module: "payroll" },
];

const finance: NavItem[] = [
  { title: "Accounting", url: "/accounting", icon: Calculator, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Ledger", url: "/ledger", icon: BookOpen, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Transactions", url: "/add-transaction", icon: BookMarked, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Chart of accounts", url: "/add-account", icon: Landmark, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Cash book", url: "/cash-book", icon: Coins, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Petty cash", url: "/petty-cash", icon: Wallet, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Trial balance", url: "/trial-balance", icon: Scale, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Income statement", url: "/income-statement", icon: LineChart, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Balance sheet", url: "/balance-sheet", icon: Scale, roles: TENANT_MANAGER_UP, module: "accounting" },
  { title: "Invoices", url: "/invoice-preview", icon: FileText, roles: TENANT_ALL, module: "sales" },
  { title: "Expenses", url: "/expenses", icon: Wallet, roles: TENANT_MANAGER_UP, module: "accounting" },
];

const insights: NavItem[] = [
  { title: "Reports", url: "/reports", icon: LineChart, roles: TENANT_MANAGER_UP, module: "sales" },
  { title: "Report builder", url: "/reports-generator", icon: FileText, roles: TENANT_MANAGER_UP, module: "sales", minPlan: "professional" },
  { title: "Notifications", url: "/notifications", icon: Bell, roles: TENANT_ALL },
  { title: "Order alerts", url: "/order-notifications", icon: BellRing, roles: TENANT_ALL, module: "sales", minPlan: "retail" },
  { title: "SMS centre", url: "/sms", icon: MessageSquare, roles: TENANT_MANAGER_UP, minPlan: "business" },
];

const network: NavItem[] = [
  { title: "Branches", url: "/branches", icon: Building2, roles: TENANT_MANAGER_UP, multiBranchOnly: true },
  { title: "Branch list", url: "/list-branches", icon: Store, roles: TENANT_MANAGER_UP, multiBranchOnly: true },
  { title: "Branch dashboard", url: "/branch", icon: LayoutDashboard, roles: TENANT_MANAGER_UP, multiBranchOnly: true },
  { title: "Manager view", url: "/manager-dashboard", icon: Briefcase, roles: TENANT_MANAGER_UP, minPlan: "retail" },
  { title: "Staff view", url: "/staff-dashboard", icon: UserRound, roles: TENANT_ALL, minPlan: "retail" },
];

const platform: NavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, roles: TENANT_ALL },
  { title: "Super admin", url: "/super", icon: ShieldCheck, roles: SUPER_ONLY },
  { title: "Businesses", url: "/manage-business", icon: Briefcase, roles: SUPER_ONLY },
  { title: "Admins", url: "/manage-admin", icon: UserCog, roles: SUPER_ONLY },
  { title: "Subscriptions", url: "/subscription", icon: CreditCard, roles: SUPER_ONLY },
  { title: "Platform reports", url: "/super-report", icon: LineChart, roles: SUPER_ONLY },
  { title: "System updates", url: "/system-updates", icon: RefreshCw, roles: SUPER_ONLY },
];

export type SidebarUser = {
  name: string;
  role: string;
  roleLabel: string;
  branch: string | null;
  initials: string;
  hasMultipleBranches: boolean;
  planKey: PlanKey | null;
};

export function AppSidebar({ user }: { user: SidebarUser }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const role = (user.role as Role) || "staff";
  const activeModules = useActiveModules();

  const renderGroup = (label: string, items: NavItem[]) => {
    const visible = items.filter(
      (item) =>
        item.roles.includes(role) &&
        (!item.module || activeModules.has(item.module)) &&
        (!item.multiBranchOnly || user.hasMultipleBranches) &&
        (!item.minPlan || meetsPlanTier(user.planKey, item.minPlan)),
    );
    if (visible.length === 0) return null;

    return (
      <SidebarGroup key={label}>
        {!collapsed && (
          <SidebarGroupLabel className="px-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => {
              const active = pathname === item.url;
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className="h-9 rounded-lg text-sidebar-foreground/75 transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate text-sm">{item.title}</span>
                      {active && (
                        <span className="ml-auto h-4 w-1 shrink-0 rounded-full bg-sidebar-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <HexMark className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-sidebar-accent-foreground">
                Dashflow POS
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">
                {user.branch ?? "All branches"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {renderGroup("Operate", operate)}
        {renderGroup("Stock", stock)}
        {renderGroup("People", people)}
        {renderGroup("Finance", finance)}
        {renderGroup("Insights", insights)}
        {renderGroup("Network", network)}
        {renderGroup("Platform", platform)}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-sidebar-accent/60 p-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-border text-xs font-semibold text-sidebar-accent-foreground">
            {user.initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">{user.roleLabel}</p>
              </div>
              <SignOutButton />
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}