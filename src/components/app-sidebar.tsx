import { Link, useRouterState } from "@tanstack/react-router";
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
  LogOut,
  Package,
  Images,
  CalendarClock,
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
} from "lucide-react";

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

type NavItem = { title: string; url: string; icon: typeof Boxes };

const operate: NavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Terminal", url: "/pos", icon: ScanBarcode },
  { title: "Sales", url: "/sales", icon: Receipt },
  { title: "Remote orders", url: "/remote-orders", icon: ShoppingBag },
  { title: "QR scanner", url: "/qr-scanner", icon: QrCode },
  { title: "Payment proofs", url: "/payment-proofs", icon: BadgeCheck },
  { title: "Till management", url: "/till-management", icon: Coins },
  { title: "Receipt preview", url: "/receipt-preview", icon: FileText },
];

const stock: NavItem[] = [
  { title: "Products", url: "/products", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Edit product", url: "/edit-product", icon: UserCog },
  { title: "Product images", url: "/product-images", icon: Images },
  { title: "Expiry tracking", url: "/expiry", icon: CalendarClock },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
];

const people: NavItem[] = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Customer file", url: "/customer-file", icon: FileText },
  { title: "Debtor payment", url: "/debtor-payment", icon: BadgeDollarSign },
  { title: "Employees", url: "/employees", icon: UsersRound },
  { title: "Employee record", url: "/employee", icon: UserRound },
  { title: "Payroll", url: "/payroll", icon: Wallet },
  { title: "Payslip", url: "/payslip", icon: FileText },
];

const finance: NavItem[] = [
  { title: "Accounting", url: "/accounting", icon: Calculator },
  { title: "Ledger", url: "/ledger", icon: BookOpen },
  { title: "Transactions", url: "/add-transaction", icon: BookMarked },
  { title: "Chart of accounts", url: "/add-account", icon: Landmark },
  { title: "Cash book", url: "/cash-book", icon: Coins },
  { title: "Petty cash", url: "/petty-cash", icon: Wallet },
  { title: "Trial balance", url: "/trial-balance", icon: Scale },
  { title: "Income statement", url: "/income-statement", icon: LineChart },
  { title: "Balance sheet", url: "/balance-sheet", icon: Scale },
  { title: "Invoices", url: "/invoice-preview", icon: FileText },
  { title: "Expenses", url: "/expenses", icon: Wallet },
];

const insights: NavItem[] = [
  { title: "Reports", url: "/reports", icon: LineChart },
  { title: "Report builder", url: "/reports-generator", icon: FileText },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Order alerts", url: "/order-notifications", icon: BellRing },
  { title: "SMS centre", url: "/sms", icon: MessageSquare },
];

const network: NavItem[] = [
  { title: "Branches", url: "/branches", icon: Building2 },
  { title: "Branch list", url: "/list-branches", icon: Store },
  { title: "Branch dashboard", url: "/branch", icon: LayoutDashboard },
  { title: "Manager view", url: "/manager-dashboard", icon: Briefcase },
  { title: "Staff view", url: "/staff-dashboard", icon: UserRound },
];

const platform: NavItem[] = [
  { title: "Super admin", url: "/super", icon: ShieldCheck },
  { title: "Businesses", url: "/manage-business", icon: Briefcase },
  { title: "Admins", url: "/manage-admin", icon: UserCog },
  { title: "Subscriptions", url: "/subscription", icon: CreditCard },
  { title: "Platform reports", url: "/super-report", icon: LineChart },
  { title: "System updates", url: "/system-updates", icon: RefreshCw },
  { title: "Profile", url: "/profile", icon: UserRound },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup key={label}>
      {!collapsed && (
        <SidebarGroupLabel className="px-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className="h-9 rounded-lg text-sidebar-foreground/75 transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                >
                  <Link to={item.url} className="flex items-center gap-3">
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

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary font-display text-base font-bold text-sidebar-primary-foreground">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-sidebar-accent-foreground">
                Meridian POS
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">Nairobi · Main Branch</p>
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
            JK
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                  James Kariuki
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">Administrator</p>
              </div>
              <Link to="/login" aria-label="Sign out">
                <LogOut className="size-4 shrink-0 text-sidebar-foreground/50" />
              </Link>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}