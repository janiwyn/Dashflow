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
/** `module: undefined` marks a Core System screen — never gated by subscription. */
type NavItem = { title: string; url: string; icon: typeof Boxes; roles: Role[]; module?: ModuleKey };

const ALL: Role[] = ["super", "admin", "manager", "staff"];
const MANAGER_UP: Role[] = ["super", "admin", "manager"];
const ADMIN_UP: Role[] = ["super", "admin"];
const SUPER_ONLY: Role[] = ["super"];

const operate: NavItem[] = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, roles: ["super", "admin"] },
  { title: "Terminal", url: "/pos", icon: ScanBarcode, roles: ALL, module: "pos" },
  { title: "Sales", url: "/sales", icon: Receipt, roles: ALL, module: "sales" },
  { title: "Remote orders", url: "/remote-orders", icon: ShoppingBag, roles: ALL, module: "sales" },
  { title: "QR scanner", url: "/qr-scanner", icon: QrCode, roles: ALL, module: "pos" },
  { title: "Payment proofs", url: "/payment-proofs", icon: BadgeCheck, roles: MANAGER_UP, module: "sales" },
  { title: "Till management", url: "/till-management", icon: Coins, roles: MANAGER_UP, module: "pos" },
  { title: "Receipt preview", url: "/receipt-preview", icon: FileText, roles: ALL, module: "pos" },
];

const stock: NavItem[] = [
  { title: "Products", url: "/products", icon: Package, roles: ALL, module: "inventory" },
  { title: "Inventory", url: "/inventory", icon: Boxes, roles: MANAGER_UP, module: "inventory" },
  { title: "Edit product", url: "/edit-product", icon: UserCog, roles: MANAGER_UP, module: "inventory" },
  { title: "Product images", url: "/product-images", icon: Images, roles: MANAGER_UP, module: "inventory" },
  { title: "Expiry tracking", url: "/expiry", icon: CalendarClock, roles: MANAGER_UP, module: "inventory" },
  { title: "Suppliers", url: "/suppliers", icon: Truck, roles: MANAGER_UP, module: "procurement" },
];

const people: NavItem[] = [
  { title: "Customers", url: "/customers", icon: Users, roles: ALL, module: "customers" },
  { title: "Customer file", url: "/customer-file", icon: FileText, roles: ALL, module: "customers" },
  { title: "Debtor payment", url: "/debtor-payment", icon: BadgeDollarSign, roles: ALL, module: "customers" },
  { title: "Attendance", url: "/attendance", icon: Fingerprint, roles: ALL, module: "attendance" },
  { title: "Employees", url: "/employees", icon: UsersRound, roles: MANAGER_UP, module: "hr" },
  { title: "Employee record", url: "/employee", icon: UserRound, roles: MANAGER_UP, module: "hr" },
  { title: "Payroll", url: "/payroll", icon: Wallet, roles: MANAGER_UP, module: "payroll" },
  { title: "Payslip", url: "/payslip", icon: FileText, roles: ALL, module: "payroll" },
];

const finance: NavItem[] = [
  { title: "Accounting", url: "/accounting", icon: Calculator, roles: MANAGER_UP, module: "accounting" },
  { title: "Ledger", url: "/ledger", icon: BookOpen, roles: MANAGER_UP, module: "accounting" },
  { title: "Transactions", url: "/add-transaction", icon: BookMarked, roles: MANAGER_UP, module: "accounting" },
  { title: "Chart of accounts", url: "/add-account", icon: Landmark, roles: MANAGER_UP, module: "accounting" },
  { title: "Cash book", url: "/cash-book", icon: Coins, roles: MANAGER_UP, module: "accounting" },
  { title: "Petty cash", url: "/petty-cash", icon: Wallet, roles: MANAGER_UP, module: "accounting" },
  { title: "Trial balance", url: "/trial-balance", icon: Scale, roles: MANAGER_UP, module: "accounting" },
  { title: "Income statement", url: "/income-statement", icon: LineChart, roles: MANAGER_UP, module: "accounting" },
  { title: "Balance sheet", url: "/balance-sheet", icon: Scale, roles: MANAGER_UP, module: "accounting" },
  { title: "Invoices", url: "/invoice-preview", icon: FileText, roles: ALL, module: "sales" },
  { title: "Expenses", url: "/expenses", icon: Wallet, roles: MANAGER_UP, module: "accounting" },
];

const insights: NavItem[] = [
  { title: "Reports", url: "/reports", icon: LineChart, roles: MANAGER_UP, module: "sales" },
  { title: "Report builder", url: "/reports-generator", icon: FileText, roles: MANAGER_UP, module: "sales" },
  { title: "Notifications", url: "/notifications", icon: Bell, roles: ALL },
  { title: "Order alerts", url: "/order-notifications", icon: BellRing, roles: ALL, module: "sales" },
  { title: "SMS centre", url: "/sms", icon: MessageSquare, roles: MANAGER_UP },
];

const network: NavItem[] = [
  { title: "Branches", url: "/branches", icon: Building2, roles: MANAGER_UP },
  { title: "Branch list", url: "/list-branches", icon: Store, roles: MANAGER_UP },
  { title: "Branch dashboard", url: "/branch", icon: LayoutDashboard, roles: MANAGER_UP },
  { title: "Manager view", url: "/manager-dashboard", icon: Briefcase, roles: MANAGER_UP },
  { title: "Staff view", url: "/staff-dashboard", icon: UserRound, roles: ALL },
];

const platform: NavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, roles: ADMIN_UP },
  { title: "Super admin", url: "/super", icon: ShieldCheck, roles: SUPER_ONLY },
  { title: "Businesses", url: "/manage-business", icon: Briefcase, roles: SUPER_ONLY },
  { title: "Admins", url: "/manage-admin", icon: UserCog, roles: SUPER_ONLY },
  { title: "Subscriptions", url: "/subscription", icon: CreditCard, roles: SUPER_ONLY },
  { title: "Platform reports", url: "/super-report", icon: LineChart, roles: SUPER_ONLY },
  { title: "System updates", url: "/system-updates", icon: RefreshCw, roles: SUPER_ONLY },
  { title: "Profile", url: "/profile", icon: UserRound, roles: ALL },
];

export type SidebarUser = {
  name: string;
  role: string;
  roleLabel: string;
  branch: string | null;
  initials: string;
};

export function AppSidebar({ user }: { user: SidebarUser }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const role = (user.role as Role) || "staff";
  const activeModules = useActiveModules();

  const renderGroup = (label: string, items: NavItem[]) => {
    const visible = items.filter(
      (item) => item.roles.includes(role) && (!item.module || activeModules.has(item.module)),
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