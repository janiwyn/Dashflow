import "server-only";

/**
 * Presentation-shaped reads.
 *
 * The screens were written against the fixture modules that used to live in
 * src/lib/*-data.ts. These functions return those exact shapes, sourced from
 * Neon, so page components consume real data without restructuring their JSX.
 * Anything new should prefer the domain query modules directly.
 */
import { clockTime, dateTime, delta, label, longDate, shortDate } from "@/lib/format";

import * as accounting from "./accounting";
import * as branchQueries from "./branches";
import * as catalog from "./catalog";
import * as customerQueries from "./customers";
import { dateInputEnd } from "./_helpers";
import * as hr from "./hr";
import * as notifications from "./notifications";
import * as operations from "./operations";
import * as procurement from "./procurement";
import * as salesQueries from "./sales";
import * as superAdmin from "./super-admin";

/* ------------------------------------------------------------------ POS */

export type PosProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  /** Cost basis — what the "Stock value" stat card totals, so a screen showing both can agree. */
  buyingPrice: number;
  stock: number;
};

export async function viewPosProducts(): Promise<PosProduct[]> {
  const rows = await catalog.getProducts();
  return rows.map((p) => ({
    id: p.sku,
    name: p.name,
    category: p.category,
    price: p.sellingPrice,
    buyingPrice: p.buyingPrice,
    stock: p.stock,
  }));
}

export async function viewCategories(): Promise<string[]> {
  return catalog.getCategoryNames();
}

export type PosSale = {
  id: string;
  customer: string;
  branch: string | null;
  cashier: string | null;
  items: number;
  amount: number;
  method: string;
  status: string;
  time: string;
};

export async function viewSales(limit = 50): Promise<PosSale[]> {
  const rows = await salesQueries.getSales({ limit });
  return rows.map((s) => ({
    id: s.reference,
    customer: s.customer,
    branch: s.branch,
    cashier: s.cashier,
    items: s.items,
    amount: s.amount,
    method: label(s.method),
    status: label(s.status),
    time: clockTime(s.soldAt),
  }));
}

export async function viewRevenueSeries() {
  const rows = await salesQueries.getRevenueSeries(7);
  return rows.map((r) => ({ day: r.day, revenue: r.revenue, orders: r.orders }));
}

export async function viewCustomers() {
  const rows = await customerQueries.getCustomers();
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    type: label(c.type),
    orders: c.orders,
    spend: c.spend,
    balance: c.balance,
  }));
}

export async function viewSuppliers() {
  const rows = await catalog.getSuppliers();
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    category: s.category,
    contact: s.contact,
    contactPerson: s.contactPerson,
    email: s.email,
    address: s.address,
    paymentTerms: s.paymentTerms,
    lastDelivery: s.lastDelivery ? shortDate(s.lastDelivery) : "—",
    payable: s.payable,
  }));
}

/** Products at or below their own reorder threshold — what "Create purchase order" starts from. */
export async function viewLowStockProducts() {
  const rows = await catalog.getLowStockProducts();
  return rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    buyingPrice: p.buyingPrice,
  }));
}

export async function viewPurchaseOrders() {
  const rows = await procurement.getPurchaseOrders();
  return rows.map((po) => ({
    id: po.id,
    reference: po.reference,
    supplierId: po.supplierId,
    supplier: po.supplierName ?? "No supplier",
    status: label(po.status),
    itemCount: po.itemCount,
    totalCost: po.totalCost,
    notes: po.notes,
    orderedAt: longDate(po.orderedAt),
    receivedAt: po.receivedAt ? longDate(po.receivedAt) : null,
  }));
}

export async function viewPurchaseOrderItems(purchaseOrderId: number) {
  return procurement.getPurchaseOrderItems(purchaseOrderId);
}

export async function viewSupplierSuppliedProducts(supplierId: number) {
  return procurement.getSupplierSuppliedProducts(supplierId);
}

/** Category id/name pairs for a select — `viewCategories()` only returns names. */
export async function viewCategoryOptions() {
  return catalog.getCategories();
}

export async function viewExpenses() {
  const rows = await accounting.getExpenses();
  return rows.map((e) => ({
    id: e.id,
    ref: e.ref,
    label: e.label,
    category: e.category,
    amount: e.amount,
    date: shortDate(e.date),
    branch: e.branch,
  }));
}

/** Expenses report — like `viewExpenses()` but filterable by branch/date, and with who spent it. */
export async function viewExpenseReport(options?: { branchId?: number; from?: string; to?: string }) {
  const rows = await accounting.getExpenses({ ...options, limit: 500 });
  return rows.map((e) => ({
    id: e.ref,
    date: shortDate(e.date),
    branch: e.branch ?? "—",
    category: e.category,
    label: e.label,
    amount: e.amount,
    spentBy: e.spentBy ?? "—",
  }));
}

/** Sales report — one row per transaction, for the report builder. */
export async function viewSalesReport(options?: { branchId?: number; from?: string; to?: string }) {
  const since = options?.from ? new Date(`${options.from}T00:00:00`) : undefined;
  const until = options?.to ? dateInputEnd(options.to) : undefined;
  const rows = await salesQueries.getSales({ branchId: options?.branchId, since, until, limit: 500 });
  return rows.map((s) => ({
    reference: s.reference,
    date: dateTime(s.soldAt),
    branch: s.branch ?? "—",
    customer: s.customer,
    items: s.items,
    amount: s.amount,
    method: label(s.method),
    soldBy: s.cashier ?? "—",
  }));
}

/** Units and revenue per product — for the report builder's "Product summary" report. */
export async function viewProductSummaryReport(options?: { branchId?: number; from?: string; to?: string }) {
  const since = options?.from ? new Date(`${options.from}T00:00:00`) : undefined;
  const until = options?.to ? dateInputEnd(options.to) : undefined;
  const rows = await salesQueries.getTopProducts({ branchId: options?.branchId, since, until, limit: 200 });
  return rows.map((p) => ({ product: p.name, sku: p.sku, unitsSold: p.units, revenue: p.revenue }));
}

/** Real payment-method totals for a window — the report builder's "Payment method analysis" report. */
export async function viewPaymentBreakdownReport(options?: { branchId?: number; from?: string; to?: string }) {
  const since = options?.from ? new Date(`${options.from}T00:00:00`) : undefined;
  const until = options?.to ? dateInputEnd(options.to) : undefined;
  const rows = await salesQueries.getPaymentBreakdown({ branchId: options?.branchId, since, until });
  return rows.map((r) => ({ method: label(r.method), count: r.count, amount: r.total }));
}

/** Outstanding debtors — the report builder's "Debtors" report. */
export async function viewDebtorReport(options?: { branchId?: number; from?: string; to?: string }) {
  const from = options?.from ? new Date(`${options.from}T00:00:00`) : undefined;
  const to = options?.to ? dateInputEnd(options.to) : undefined;
  const rows = await operations.getDebtors({ branchId: options?.branchId, from, to, outstandingOnly: true });
  return rows.map((d) => ({
    date: shortDate(d.date),
    name: d.name,
    itemTaken: d.itemTaken ?? "—",
    balance: d.balance,
    status: "Outstanding",
  }));
}

/** pos-data `branches`: name / manager / staff / today / status. */
export async function viewBranchSummaries() {
  const rows = await branchQueries.getBranches();
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    manager: b.manager ?? "Unassigned",
    staff: b.staff,
    today: b.todaySales,
    status: label(b.status),
  }));
}

/* ---------------------------------------------------------------- Stock */

export type StockProduct = {
  id: number;
  name: string;
  category: string;
  sellingPrice: number;
  buyingPrice: number;
  stock: number;
  branch: string;
  expiryDate?: string;
  imagePath?: string | null;
};

export async function viewStockProducts(): Promise<StockProduct[]> {
  const rows = await catalog.getProducts();
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    sellingPrice: p.sellingPrice,
    buyingPrice: p.buyingPrice,
    stock: p.stock,
    branch: p.branch,
    expiryDate: p.expiryDate ?? undefined,
    imagePath: p.imagePath,
  }));
}

/** Branch names for filter dropdowns, "All branches" first. */
export async function viewBranchNames(): Promise<string[]> {
  return branchQueries.getBranchNames();
}

/** Branch names without the "All branches" sentinel. */
export async function viewBranchOptions(): Promise<string[]> {
  const rows = await branchQueries.getBranches();
  return rows.map((b) => b.name);
}

export type ExpiringProduct = {
  id: number;
  name: string;
  branch: string;
  stock: number;
  expiryDate: string;
};

export async function viewExpiringProducts(): Promise<ExpiringProduct[]> {
  const rows = await notifications.getExpiryAlerts();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    branch: r.branch ?? "Unassigned",
    stock: r.stock,
    expiryDate: r.expiryDate ?? "",
  }));
}

export type SmsLog = {
  id: number;
  recipient: string;
  message: string;
  status: "sent" | "failed" | "queued";
  sentAt: string;
};

export async function viewSmsLogs(): Promise<SmsLog[]> {
  const rows = await notifications.getSmsLogs();
  return rows.map((r) => ({
    id: r.id,
    recipient: r.recipient,
    message: r.message,
    status: r.status,
    sentAt: `${shortDate(r.sentAt)}, ${clockTime(r.sentAt)}`,
  }));
}

export async function viewLowStockNotifs() {
  const rows = await notifications.getLowStockAlerts();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    branch: r.branch ?? "Unassigned",
    stock: r.stock,
    price: r.price,
  }));
}

export async function viewShopDebtorNotifs() {
  const rows = await notifications.getShopDebtorAlerts();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    branch: r.branch ?? "Unassigned",
    dueDate: r.dueDate ? longDate(r.dueDate) : "—",
    balance: r.balance,
  }));
}

export async function viewCustomerDebtorNotifs() {
  const rows = await notifications.getCustomerDebtorAlerts();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    dueDate: r.dueDate ? longDate(r.dueDate) : "—",
    balance: r.balance,
  }));
}

export type PendingOrder = {
  id: number;
  reference: string;
  customer: string;
  phone: string;
  branch: string;
  amount: number;
  paymentMethod: string;
  itemsCount: number;
  createdAt: string;
};

export async function viewPendingOrders(): Promise<PendingOrder[]> {
  const rows = await operations.getPendingOrders();
  return rows.map((o) => ({
    id: o.id,
    reference: o.reference,
    customer: o.customer,
    phone: o.phone ?? "—",
    branch: o.branch ?? "Unassigned",
    amount: o.amount,
    paymentMethod: o.paymentMethod ?? "—",
    itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
    createdAt: `${longDate(o.placedAt)}, ${clockTime(o.placedAt)}`,
  }));
}

/* ------------------------------------------------------------------- HR */

export type Employee = {
  id: number;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  branch: string;
  position: string;
  baseSalary: number;
  hireDate: string;
  status: "Active" | "Inactive";
};

export async function viewEmployees(): Promise<Employee[]> {
  const rows = await hr.getEmployees();
  return rows.map((e) => ({
    id: e.id,
    userId: e.userId,
    name: e.name,
    email: e.email ?? "—",
    phone: e.phone ?? "—",
    branch: e.branch ?? "Unassigned",
    position: e.position,
    baseSalary: e.baseSalary,
    hireDate: e.hireDate,
    status: e.status === "active" ? "Active" : "Inactive",
  }));
}

export async function viewHrBranches() {
  const rows = await branchQueries.getBranches();
  return rows.map((b) => ({ id: b.id, name: b.name }));
}

export async function viewSystemUsers() {
  const rows = await hr.getUserAccounts();
  return rows.map((u) => ({ id: u.id, username: u.username ?? u.email, name: u.name }));
}

export type PayrollRecord = {
  id: number;
  employeeId: number;
  employee: string;
  baseSalary: number;
  transport: number;
  housing: number;
  medical: number;
  overtime: number;
  nssf: number;
  tax: number;
  loan: number;
  otherDeductions: number;
  gross: number;
  net: number;
  month: string;
  status: "Pending" | "Paid";
};

export async function viewPayrollRecords(): Promise<PayrollRecord[]> {
  const rows = await hr.getPayrollRecords();
  return rows.map((r) => ({
    ...r,
    status: r.status === "paid" ? "Paid" : "Pending",
  }));
}

export type SystemUserAccount = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  createdAt: string;
  status: "Active" | "Suspended";
};

export async function viewUserAccounts(): Promise<SystemUserAccount[]> {
  const rows = await hr.getUserAccounts();
  return rows.map((u) => ({
    id: u.id,
    username: u.username ?? u.email,
    name: u.name,
    email: u.email,
    role: u.role,
    branch: u.branch,
    createdAt: longDate(u.createdAt),
    status: u.status === "active" ? "Active" : "Suspended",
  }));
}

/* ----------------------------------------------------------- Accounting */

export async function viewLedgerAccounts() {
  const rows = await accounting.getLedgerAccounts();
  return rows.map((a) => ({ id: a.id, name: a.name, type: a.type }));
}

/** Entries keyed by account id, matching the old `ledgerEntries` record. */
export async function viewLedgerEntries() {
  const accounts = await accounting.getLedgerAccounts();
  const map: Record<number, { date: string; description: string; debit: number; credit: number }[]> =
    {};
  await Promise.all(
    accounts.map(async (a) => {
      const entries = await accounting.getLedgerEntries(a.id);
      map[a.id] = entries.map((e) => ({
        date: shortDate(e.date),
        description: e.description,
        debit: e.debit,
        credit: e.credit,
      }));
    }),
  );
  return map;
}

export async function viewTransactionsFeed() {
  const rows = await accounting.getTransactions();
  return rows.map((t) => ({
    id: t.id,
    date: shortDate(t.date),
    type: t.type === "income" ? "Income" : "Expense",
    description: t.description,
    branch: t.branch ?? "—",
    amount: t.amount,
    handledBy: t.handledBy ?? "—",
  }));
}

export async function viewCashBookEntries() {
  const rows = await accounting.getCashBook();
  return rows.map((e) => ({
    id: e.id,
    date: shortDate(e.date),
    particulars: e.particulars,
    cashIn: e.cashIn,
    bankIn: e.bankIn,
    cashOut: e.cashOut,
    bankOut: e.bankOut,
    source: e.source,
  }));
}

export async function viewPettyCash() {
  const data = await accounting.getPettyCash();
  return {
    actions: data.actions.map((a) => ({
      date: `${shortDate(a.date)} ${clockTime(a.date)}`,
      action: a.action,
      amount: a.amount,
      approvedBy: a.approvedBy ?? "—",
    })),
    transactions: data.transactions.map((t) => ({
      id: t.id,
      date: shortDate(t.date),
      name: t.name,
      branch: t.branch ?? "—",
      purpose: t.purpose,
      reason: t.reason ?? "—",
      amount: t.amount,
      balance: t.balance,
      approvedBy: t.approvedBy ?? "—",
    })),
    balance: data.balance,
  };
}

/** Invoice preview for a receipt reference, or the newest sale. */
export async function viewInvoice(reference?: string) {
  const ref = reference ?? (await salesQueries.getLatestSaleReference());
  if (!ref) return null;
  const sale = await salesQueries.getSaleByReference(ref);
  if (!sale) return null;

  return {
    invoiceNo: sale.reference,
    date: longDate(sale.soldAt),
    dueDate: sale.dueDate ? longDate(sale.dueDate) : longDate(sale.soldAt),
    company: {
      name: sale.company?.name ?? "Meridian Traders Ltd",
      tagline: sale.company?.tagline ?? "",
      address: sale.company?.address ?? "",
      pin: sale.company?.pin ?? "",
    },
    customer: {
      name: sale.customer?.name ?? sale.customerName,
      email: sale.customer?.email ?? "—",
      contact: sale.customer?.contact ?? "—",
    },
    items: sale.items.map((i) => ({ id: i.sku ?? "", name: i.name, qty: i.qty, price: i.price })),
    taxRate: sale.taxRate || 16,
    amountPaid: sale.amountPaid,
  };
}

/** Till receipt for a reference, or the newest sale. */
export async function viewReceipt(reference?: string) {
  const ref = reference ?? (await salesQueries.getLatestSaleReference());
  if (!ref) return null;
  const sale = await salesQueries.getSaleByReference(ref);
  if (!sale) return null;

  return {
    invoiceNo: sale.reference,
    date: `${longDate(sale.soldAt)}, ${clockTime(sale.soldAt)}`,
    customerName: sale.customerName,
    cashier: sale.cashierName ?? "—",
    method: label(sale.method),
    items: sale.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
  };
}

/* ------------------------------------------------------------- Branches */

export type Branch = {
  id: number;
  name: string;
  location: string;
  contact: string;
  manager: string | null;
  staff: number;
  status: "Open" | "Closed";
  todaySales: number;
};

export async function viewBranches(): Promise<Branch[]> {
  const rows = await branchQueries.getBranches();
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    location: b.location ?? "—",
    contact: b.contact ?? "—",
    manager: b.manager,
    staff: b.staff,
    status: b.status === "open" ? "Open" : "Closed",
    todaySales: b.todaySales,
  }));
}

export async function viewBranchStock() {
  const rows = await branchQueries.getBranches();
  const map: Record<number, { name: string; stockLeft: number }[]> = {};
  await Promise.all(
    rows.map(async (b) => {
      const stock = await branchQueries.getBranchStock(b.id);
      map[b.id] = stock.map((s) => ({ name: s.name, stockLeft: s.stockLeft }));
    }),
  );
  return map;
}

export async function viewBranchWorkers() {
  const rows = await branchQueries.getBranches();
  const map: Record<number, { id: number; name: string; role: string; phone: string }[]> = {};
  await Promise.all(
    rows.map(async (b) => {
      const workers = await branchQueries.getBranchWorkers(b.id);
      map[b.id] = workers.map((w) => ({
        id: w.id,
        name: w.name,
        role: w.role,
        phone: w.phone ?? "—",
      }));
    }),
  );
  return map;
}

export async function viewBranchFinancials() {
  const rows = await branchQueries.getBranches();
  const map: Record<number, { totalSales: number; totalExpenses: number }> = {};
  await Promise.all(
    rows.map(async (b) => {
      const fin = await branchQueries.getBranchFinancials(b.id);
      map[b.id] = { totalSales: fin.totalSales, totalExpenses: fin.totalExpenses };
    }),
  );
  return map;
}

/* ------------------------------------------------------------ Sales ops */

export type RemoteOrder = {
  id: number;
  ref: string;
  date: string;
  branch: string;
  customer: string;
  phone: string;
  items: { name: string; qty: number; price: number }[];
  amount: number;
  status: "Pending" | "Finished" | "Cancelled";
};

export async function viewRemoteOrders(): Promise<RemoteOrder[]> {
  const rows = await operations.getRemoteOrders();
  return rows.map((o) => ({
    id: o.id,
    ref: o.reference,
    date: `${longDate(o.placedAt)}, ${clockTime(o.placedAt)}`,
    branch: o.branch ?? "Unassigned",
    customer: o.customer,
    phone: o.phone ?? "—",
    items: o.items,
    amount: o.amount,
    status: label(o.status) as "Pending" | "Finished" | "Cancelled",
  }));
}

export type PaymentProof = {
  id: number;
  ref: string;
  branch: string;
  customer: string;
  phone: string;
  location: string;
  method: "MTN Merchant" | "Airtel Merchant";
  status: "Pending" | "Verified" | "Rejected";
  date: string;
};

export async function viewPaymentProofs(): Promise<PaymentProof[]> {
  const rows = await operations.getPaymentProofs();
  return rows.map((p) => ({
    id: p.id,
    ref: p.ref,
    branch: p.branch ?? "Unassigned",
    customer: p.customer,
    phone: p.phone ?? "—",
    location: p.location ?? "—",
    method: label(p.method) as "MTN Merchant" | "Airtel Merchant",
    status: label(p.status) as "Pending" | "Verified" | "Rejected",
    date: `${longDate(p.date)}, ${clockTime(p.date)}`,
  }));
}

export type Till = {
  id: number;
  name: string;
  branch: string;
  staff: string;
  phone: string;
  created: string;
  balance: number;
};

export async function viewTills(): Promise<Till[]> {
  const rows = await operations.getTills();
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    branch: t.branch ?? "Unassigned",
    staff: t.staff ?? "Unassigned",
    phone: t.phone ?? "—",
    created: longDate(t.created),
    balance: t.balance,
  }));
}

export async function viewTillRemovals() {
  const rows = await operations.getTillRemovals();
  return rows.map((r) => ({
    id: r.id,
    till: r.till,
    amount: r.amount,
    approvedBy: r.approvedBy ?? "—",
    balanceAfter: r.balanceAfter,
    date: `${longDate(r.date)}, ${clockTime(r.date)}`,
  }));
}

export type Debtor = {
  id: number;
  name: string;
  phone: string;
  itemTaken: string;
  quantity: number;
  amountPaid: number;
  balance: number;
  branch: string;
  date: string;
};

export async function viewDebtors(): Promise<Debtor[]> {
  const rows = await operations.getDebtors();
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone ?? "—",
    itemTaken: d.itemTaken ?? "—",
    quantity: d.quantity,
    amountPaid: d.amountPaid,
    balance: d.balance,
    branch: d.branch ?? "Unassigned",
    date: longDate(d.date),
  }));
}

export async function viewCustomerFile(id?: number) {
  const file = await customerQueries.getCustomerFile(id);
  if (!file) return null;
  return {
    customer: {
      id: file.profile.id,
      name: file.profile.name,
      contact: file.profile.contact ?? "—",
      email: file.profile.email ?? "—",
      paymentMethod: file.profile.preferredPaymentMethod ?? "—",
      openingDate: longDate(file.profile.openingDate),
      accountBalance: file.profile.accountBalance,
      amountCredited: file.profile.amountCredited,
    },
    transactions: file.transactions.map((t) => ({
      date: `${longDate(t.date)}, ${clockTime(t.date)}`,
      branch: t.branch ?? "—",
      ref: t.ref,
      products: t.products,
      paid: t.paid,
      credited: t.credited,
      status: t.status === "paid" ? "paid" : "pending",
    })),
  };
}

export async function viewStorefrontProducts() {
  const rows = await operations.getStorefrontProducts();
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    branch: p.branch ?? "Unassigned",
  }));
}

export async function viewTrackableOrder(reference?: string) {
  const orders = await operations.getRemoteOrders();
  const order = reference ? orders.find((o) => o.reference === reference) : orders[0];
  if (!order) return null;
  return {
    ref: order.reference,
    customer: order.customer,
    amount: order.amount,
    status: order.status,
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, subtotal: i.qty * i.price })),
  };
}

/* ---------------------------------------------------------- Super admin */

export type Business = {
  id: number;
  name: string;
  adminName: string | null;
  adminEmail: string | null;
  phone: string;
  address: string;
  dateRegistered: string;
  status: "active" | "suspended";
  subscriptionStart: string;
  subscriptionEnd: string;
  subscriptionStatus: "active" | "pending" | "expired";
};

export async function viewBusinesses(): Promise<Business[]> {
  const rows = await superAdmin.getBusinesses();
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    adminName: b.adminName,
    adminEmail: b.adminEmail,
    phone: b.phone ?? "—",
    address: b.address ?? "—",
    dateRegistered: b.dateRegistered,
    status: b.status,
    subscriptionStart: b.subscriptionStart ?? "—",
    subscriptionEnd: b.subscriptionEnd ?? "—",
    subscriptionStatus: b.subscriptionStatus,
  }));
}

export type Admin = {
  id: string;
  username: string;
  email: string;
  businessName: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
};

export async function viewAdmins(): Promise<Admin[]> {
  const rows = await superAdmin.getAdmins();
  return rows.map((a) => ({
    id: a.id,
    username: a.name,
    email: a.email,
    businessName: a.businessName ?? "—",
    role: a.role,
    status: a.status === "active" ? "active" : "inactive",
    createdAt: a.createdAt.toISOString().slice(0, 10),
  }));
}

export async function viewBusinessGrowth() {
  const rows = await superAdmin.getBusinessGrowth();
  return rows.map((r) => ({ month: r.month, total: r.total }));
}

export async function viewSystemLogs(): Promise<string[]> {
  const rows = await superAdmin.getSystemLogs();
  return rows.map(
    (l) =>
      `${l.createdAt.toISOString().slice(0, 19).replace("T", " ")} - [${l.actor}] ${l.message}`,
  );
}

export async function viewProfile() {
  const { getProfile } = await import("./profile");
  const p = await getProfile();
  if (!p) return null;
  return {
    id: p.id,
    username: p.username ?? p.email,
    name: p.name,
    email: p.email,
    phone: p.phone ?? "—",
    role: p.position ?? label(p.role),
    branch: p.branch ?? "All branches",
  };
}

export async function viewBusinessSettings() {
  const { getBusinessProfile } = await import("./profile");
  const b = await getBusinessProfile();
  if (!b) return null;
  return {
    name: b.name,
    tagline: b.tagline ?? "",
    phone: b.phone ?? "",
    address: b.address ?? "",
    taxPin: b.taxPin ?? "",
    currency: b.currency,
  };
}

/** Notification row shapes, kept for the alert screens. */
export type LowStockNotif = Awaited<ReturnType<typeof viewLowStockNotifs>>[number];
export type ShopDebtorNotif = Awaited<ReturnType<typeof viewShopDebtorNotifs>>[number];
export type CustomerDebtorNotif = Awaited<ReturnType<typeof viewCustomerDebtorNotifs>>[number];

/* --------------------------------------------------------------- Headline stats */

/** Everything the operations overview's stat row needs. */
export async function viewDashboardStats() {
  const [totals, inventory, customerCount] = await Promise.all([
    salesQueries.getSalesTotals(),
    catalog.getInventorySummary(),
    customerQueries.getCustomerCount(),
  ]);

  return {
    todayRevenue: totals.todayRevenue,
    revenueDelta: delta(totals.todayRevenue, totals.yesterdayRevenue),
    receipts: totals.todayReceipts,
    receiptsDelta: delta(totals.todayReceipts, totals.yesterdayReceipts),
    averageBasket: totals.averageBasket,
    weekRevenue: totals.weekRevenue,
    stockValue: inventory.costValue,
    lowStockCount: inventory.lowStock,
    skuCount: inventory.skuCount,
    customers: customerCount,
  };
}

export async function viewInventoryStats() {
  return catalog.getInventorySummary();
}

export async function viewSalesStats() {
  const [totals, refunds, pending] = await Promise.all([
    salesQueries.getSalesTotals(),
    salesQueries.getRefundTotals(1),
    salesQueries.getPendingReceiptCount(),
  ]);

  return {
    gross: totals.todayRevenue,
    grossDelta: delta(totals.todayRevenue, totals.yesterdayRevenue),
    receipts: totals.todayReceipts,
    receiptsDelta: delta(totals.todayReceipts, totals.yesterdayReceipts),
    refunds: refunds.amount,
    refundCount: refunds.receipts,
    pending,
  };
}

export async function viewReportStats() {
  const [totals, series, margin] = await Promise.all([
    salesQueries.getSalesTotals(),
    salesQueries.getRevenueSeries(7),
    salesQueries.getGrossMarginTrend(7),
  ]);
  const orders = series.reduce((s, d) => s + d.orders, 0);

  return {
    weekRevenue: totals.weekRevenue,
    orders,
    averagePerDay: series.length ? Math.round(orders / series.length) : 0,
    marginPct: margin.marginPct,
    marginDeltaPct: margin.deltaPct,
    bestDay: series.reduce(
      (best, d) => (d.revenue > best.revenue ? d : best),
      series[0] ?? { day: "—", revenue: 0, orders: 0, date: "" },
    ),
  };
}

export async function viewManagerStats() {
  const [totals, expenseToday, inventory] = await Promise.all([
    salesQueries.getSalesTotals(),
    accounting.getExpenseTotals(1),
    catalog.getInventorySummary(),
  ]);

  return {
    salesToday: totals.todayRevenue,
    expensesToday: expenseToday,
    productCount: inventory.skuCount,
    lowStock: inventory.lowStock,
  };
}

/** Today's numbers for the signed-in cashier. */
export async function viewStaffStats() {
  const { getCurrentUser } = await import("@/lib/session");
  const user = await getCurrentUser();
  if (!user) return { revenue: 0, receipts: 0, items: 0 };
  return salesQueries.getCashierTotals(user.id);
}

/** The signed-in cashier's own sales today — real receipts, not a sample. */
export async function viewMySalesToday() {
  const { getCurrentUser } = await import("@/lib/session");
  const user = await getCurrentUser();
  if (!user) return [];
  return salesQueries.getMySalesToday(user.id);
}
