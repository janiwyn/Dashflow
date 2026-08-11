/**
 * Seeds the Neon database from the datasets that used to live in src/lib/*-data.ts.
 *
 *   npm run db:seed
 *
 * Destructive: every table is truncated first so the script is re-runnable.
 */
import "./load-env";

import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";

import { db } from "./index";
import * as t from "./schema";

/**
 * All demo data is positioned relative to the day the seed runs, so the
 * dashboard always has "today" figures and expiry alerts stay in the future.
 */
const TODAY = (() => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  return d;
})();

const day = (offset: number) => {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

const at = (offset: number, time: string) => {
  const d = day(offset);
  const [h, m] = time.split(":").map(Number);
  d.setUTCHours(h, m, 0, 0);
  return d;
};

/** Payroll periods, as YYYY-MM. */
const monthKey = (offset: number) => {
  const d = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const THIS_MONTH = monthKey(0);
const PREV_MONTH = monthKey(-1);

/** Deterministic PRNG so repeated seeds produce identical data. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const chunk = <T,>(rows: T[], size = 500): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
};

async function insertAll<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
) {
  for (const part of chunk(rows)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(table).values(part as any);
  }
}

async function reset() {
  console.log("• truncating existing data…");
  await db.execute(sql`
    TRUNCATE TABLE
      "sale_items", "sales", "customers",
      "remote_order_items", "remote_orders", "payment_proofs",
      "till_removals", "tills", "debtor_payments", "debtors",
      "payroll_records", "employees",
      "ledger_entries", "ledger_accounts", "transactions", "expenses",
      "cash_book_entries", "petty_cash_actions", "petty_cash_transactions",
      "notifications", "sms_logs", "system_logs", "system_updates",
      "products", "categories", "suppliers",
      "session", "account", "verification", "user",
      "business_modules", "branches", "businesses"
    RESTART IDENTITY CASCADE
  `);
}

async function seedBusinesses() {
  console.log("• businesses");
  const [meridian] = await db
    .insert(t.businesses)
    .values({
      name: "Meridian Traders Ltd",
      tagline: "Nairobi's trusted general supplies",
      phone: "0712 345 000",
      address: "Kimathi Street, Nairobi CBD",
      taxPin: "P051234567X",
      status: "active",
      dateRegistered: "2024-11-02",
      subscriptionStart: "2025-01-01",
      subscriptionEnd: "2027-01-01",
      subscriptionStatus: "active",
    })
    .returning();

  // Tenants managed from the super-admin console.
  const tenants = await db
    .insert(t.businesses)
    .values([
      { name: "Mama Njeri Supermarket", phone: "0722 341 908", address: "Ngong Road, Nairobi", status: "active", dateRegistered: "2025-01-14", subscriptionStart: "2025-01-14", subscriptionEnd: "2026-01-14", subscriptionStatus: "active" },
      { name: "Kilimani Fresh Mart", phone: "0733 214 771", address: "Kilimani, Nairobi", status: "active", dateRegistered: "2025-02-02", subscriptionStart: "2025-02-02", subscriptionEnd: "2025-08-02", subscriptionStatus: "expired" },
      { name: "Eastleigh Traders Ltd", phone: "0711 902 344", address: "Eastleigh, Nairobi", status: "suspended", dateRegistered: "2025-03-18", subscriptionStart: "2025-03-18", subscriptionEnd: "2025-09-18", subscriptionStatus: "pending" },
      { name: "Westside Pharmacy", phone: "0700 556 812", address: "Westlands, Nairobi", status: "active", dateRegistered: "2025-04-05", subscriptionStart: "2025-04-05", subscriptionEnd: "2026-04-05", subscriptionStatus: "active" },
      { name: "Thika Road Electronics", phone: "0745 981 200", address: "Thika Road, Nairobi", status: "active", dateRegistered: "2025-05-27", subscriptionStart: "2025-05-27", subscriptionEnd: "2025-11-27", subscriptionStatus: "pending" },
      { name: "Rongai Hardware", phone: "0721 443 908", address: "Rongai, Kajiado", status: "suspended", dateRegistered: "2025-06-11", subscriptionStart: "2025-06-11", subscriptionEnd: "2025-07-11", subscriptionStatus: "expired" },
      { name: "Karen Boutique House", phone: "0798 302 156", address: "Karen, Nairobi", status: "active", dateRegistered: "2025-07-01", subscriptionStart: "2025-07-01", subscriptionEnd: "2026-07-01", subscriptionStatus: "active" },
    ])
    .returning();

  return { meridianId: meridian.id, tenants };
}

/**
 * Per-business module subscriptions — mirrors the platform's worked examples:
 * a lean retail shop, a full-stack supermarket, and a wholesaler running
 * without a POS module at all.
 */
async function seedModules(meridianId: number, tenants: { id: number }[]) {
  console.log("• module subscriptions");
  const ALL: (typeof t.moduleKey.enumValues)[number][] = [
    "pos",
    "inventory",
    "sales",
    "accounting",
    "procurement",
    "customers",
    "hr",
    "attendance",
    "payroll",
  ];

  const plans: { businessId: number; modules: (typeof t.moduleKey.enumValues)[number][] }[] = [
    { businessId: meridianId, modules: ALL },
    // Mama Njeri Supermarket — full-stack supermarket, no payroll yet.
    { businessId: tenants[0].id, modules: ["pos", "inventory", "sales", "accounting", "procurement", "hr", "attendance"] },
    // Kilimani Fresh Mart — small retail shop: POS + Inventory only.
    { businessId: tenants[1].id, modules: ["pos", "inventory"] },
    // Eastleigh Traders Ltd — wholesaler, no POS: inventory, sales, procurement, accounting, customer credit.
    { businessId: tenants[2].id, modules: ["inventory", "sales", "procurement", "accounting", "customers"] },
    // Westside Pharmacy
    { businessId: tenants[3].id, modules: ["pos", "inventory", "sales", "customers"] },
    // Thika Road Electronics
    { businessId: tenants[4].id, modules: ["pos", "inventory", "sales", "accounting"] },
    // Rongai Hardware
    { businessId: tenants[5].id, modules: ["pos", "inventory"] },
    // Karen Boutique House
    { businessId: tenants[6].id, modules: ["pos", "inventory", "sales", "customers"] },
  ];

  await insertAll(
    t.businessModules,
    plans.flatMap((p) => p.modules.map((moduleKey) => ({ businessId: p.businessId, moduleKey }))),
  );
}

async function seedBranches(businessId: number) {
  console.log("• branches");
  const rows = await db
    .insert(t.branches)
    .values([
      { businessId, name: "Nairobi — Main", location: "Moi Avenue, Nairobi CBD", contact: "0712 345 001", managerName: "James Kamau", status: "open" as const },
      { businessId, name: "Westlands", location: "Parklands Road, Westlands", contact: "0712 345 002", managerName: "Alice Mwangi", status: "open" as const },
      { businessId, name: "Kilimani", location: "Yaya Centre, Kilimani", contact: "0712 345 003", managerName: "Lucy Wanjiru", status: "open" as const },
      { businessId, name: "Karen", location: "Karen Road, Karen", contact: "0712 345 004", managerName: "Grace Otieno", status: "open" as const },
      { businessId, name: "Mombasa — Nyali", location: "Nyali Road, Mombasa", contact: "0712 345 005", managerName: "Aisha Said", status: "open" as const },
      { businessId, name: "Kisumu — Oginga", location: "Oginga Odinga Street, Kisumu", contact: "0712 345 006", managerName: "Brian Ochieng", status: "open" as const },
      { businessId, name: "Nakuru — CBD", location: "Kenyatta Avenue, Nakuru", contact: "0712 345 007", managerName: null, status: "closed" as const },
    ])
    .returning();

  const byName = new Map(rows.map((b) => [b.name, b.id]));
  return {
    all: rows,
    id: (name: string) => byName.get(name)!,
    main: byName.get("Nairobi — Main")!,
    westlands: byName.get("Westlands")!,
    kilimani: byName.get("Kilimani")!,
    karen: byName.get("Karen")!,
    mombasa: byName.get("Mombasa — Nyali")!,
    kisumu: byName.get("Kisumu — Oginga")!,
    nakuru: byName.get("Nakuru — CBD")!,
  };
}

type SeedUser = {
  key: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: "super" | "admin" | "manager" | "staff";
  status?: "active" | "suspended";
  businessId: number | null;
  branchId: number | null;
};

const SEED_PASSWORD = "password123";

async function seedUsers(users: SeedUser[]) {
  console.log("• users + credentials");
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const now = new Date();
  const ids = new Map<string, string>();

  const userRows = users.map((u) => {
    const id = crypto.randomUUID();
    ids.set(u.key, id);
    return {
      id,
      name: u.name,
      email: u.email,
      emailVerified: true,
      username: u.username,
      phone: u.phone,
      role: u.role,
      status: u.status ?? ("active" as const),
      businessId: u.businessId,
      branchId: u.branchId,
      createdAt: now,
      updatedAt: now,
    };
  });

  await insertAll(t.users, userRows);

  // better-auth stores email/password credentials in `account` with providerId "credential".
  await insertAll(
    t.accounts,
    userRows.map((u) => ({
      id: crypto.randomUUID(),
      accountId: u.id,
      providerId: "credential",
      userId: u.id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    })),
  );

  return (key: string) => ids.get(key)!;
}

async function seedCatalog(businessId: number, b: Awaited<ReturnType<typeof seedBranches>>) {
  console.log("• categories, products, suppliers");
  const categoryRows = await db
    .insert(t.categories)
    .values(
      ["Beverages", "Dairy", "Pantry", "Household"].map((name) => ({ businessId, name })),
    )
    .returning();
  const cat = new Map(categoryRows.map((c) => [c.name, c.id]));

  const productSeed = [
    { sku: "P-1041", name: "Arabica Beans 1kg", category: "Beverages", sellingPrice: 1850, buyingPrice: 1400, stock: 42, branchId: b.westlands, expiryDate: iso(day(9)) },
    { sku: "P-1042", name: "Fresh Milk 500ml", category: "Dairy", sellingPrice: 65, buyingPrice: 48, stock: 180, branchId: b.main, expiryDate: iso(day(3)) },
    { sku: "P-1043", name: "Brown Sugar 2kg", category: "Pantry", sellingPrice: 320, buyingPrice: 250, stock: 8, branchId: b.kilimani, expiryDate: null },
    { sku: "P-1044", name: "Sunflower Oil 3L", category: "Pantry", sellingPrice: 780, buyingPrice: 610, stock: 26, branchId: b.westlands, expiryDate: null },
    { sku: "P-1045", name: "Wheat Flour 2kg", category: "Pantry", sellingPrice: 210, buyingPrice: 165, stock: 64, branchId: b.karen, expiryDate: null },
    { sku: "P-1046", name: "Green Tea 100 bags", category: "Beverages", sellingPrice: 540, buyingPrice: 410, stock: 31, branchId: b.main, expiryDate: null },
    { sku: "P-1047", name: "Cheddar Block 400g", category: "Dairy", sellingPrice: 690, buyingPrice: 520, stock: 3, branchId: b.kilimani, expiryDate: iso(day(5)) },
    { sku: "P-1048", name: "Bar Soap 6pk", category: "Household", sellingPrice: 450, buyingPrice: 340, stock: 77, branchId: b.westlands, expiryDate: null },
    { sku: "P-1049", name: "Rice Pishori 5kg", category: "Pantry", sellingPrice: 1290, buyingPrice: 990, stock: 19, branchId: b.karen, expiryDate: null },
    { sku: "P-1050", name: "Cooking Salt 1kg", category: "Pantry", sellingPrice: 55, buyingPrice: 40, stock: 210, branchId: b.kisumu, expiryDate: null },
    { sku: "P-1051", name: "Detergent 2L", category: "Household", sellingPrice: 620, buyingPrice: 470, stock: 12, branchId: b.kilimani, expiryDate: null },
    { sku: "P-1052", name: "Yoghurt 250ml", category: "Dairy", sellingPrice: 90, buyingPrice: 62, stock: 48, branchId: b.main, expiryDate: iso(day(7)) },
  ];

  const products = await db
    .insert(t.products)
    .values(
      productSeed.map((p) => ({
        businessId,
        branchId: p.branchId,
        categoryId: cat.get(p.category)!,
        sku: p.sku,
        name: p.name,
        sellingPrice: p.sellingPrice,
        buyingPrice: p.buyingPrice,
        stock: p.stock,
        expiryDate: p.expiryDate,
      })),
    )
    .returning();

  await insertAll(t.suppliers, [
    { businessId, name: "Highland Coffee Ltd", categoryId: cat.get("Beverages")!, contact: "0733 220 118", email: "orders@highlandcoffee.co.ke", lastDelivery: iso(day(-2)), payable: 184000 },
    { businessId, name: "Rift Valley Dairy", categoryId: cat.get("Dairy")!, contact: "0722 908 441", email: "sales@rvdairy.co.ke", lastDelivery: iso(day(0)), payable: 42500 },
    { businessId, name: "Unga Millers", categoryId: cat.get("Pantry")!, contact: "0700 331 220", email: "trade@ungamillers.co.ke", lastDelivery: iso(day(-5)), payable: 0 },
    { businessId, name: "CleanCo Supplies", categoryId: cat.get("Household")!, contact: "0711 552 003", email: "hello@cleanco.co.ke", lastDelivery: iso(day(-7)), payable: 31200 },
  ]);

  return { products, cat };
}

async function seedCustomers(businessId: number) {
  console.log("• customers");
  return db
    .insert(t.customers)
    .values([
      { businessId, name: "Riverside Cafe Ltd", type: "wholesale" as const, contact: "0722 556 890", email: "accounts@riversidecafe.co.ke", preferredPaymentMethod: "M-Pesa / Invoice", openingDate: "2026-01-12", accountBalance: 26400, amountCredited: 42200 },
      { businessId, name: "Peter Mwangi", type: "retail" as const, contact: "0711 550 219", email: "peter.mwangi@gmail.com", preferredPaymentMethod: "Card", openingDate: "2025-04-02", accountBalance: 0, amountCredited: 0 },
      { businessId, name: "Grace Otieno", type: "retail" as const, contact: "0733 445 210", email: "grace.otieno@gmail.com", preferredPaymentMethod: "M-Pesa", openingDate: "2025-06-19", accountBalance: 0, amountCredited: 0 },
      { businessId, name: "Halima Yusuf", type: "retail" as const, contact: "0700 992 341", email: "halima.yusuf@gmail.com", preferredPaymentMethod: "Cash", openingDate: "2025-09-30", accountBalance: 1200, amountCredited: 1200 },
      { businessId, name: "Nyali Hotel", type: "wholesale" as const, contact: "0722 118 004", email: "procurement@nyalihotel.co.ke", preferredPaymentMethod: "Invoice", openingDate: "2025-02-14", accountBalance: 118000, amountCredited: 260000 },
    ])
    .returning();
}

type ProductRow = Awaited<ReturnType<typeof seedCatalog>>["products"][number];

async function seedSales(
  businessId: number,
  b: Awaited<ReturnType<typeof seedBranches>>,
  products: ProductRow[],
  customers: Awaited<ReturnType<typeof seedCustomers>>,
  userId: (key: string) => string,
) {
  console.log("• sales history");
  const customerByName = new Map(customers.map((c) => [c.name, c]));
  const cashiers = [
    { id: userId("jkamau"), name: "James Kamau", branchId: b.main },
    { id: userId("amwangi"), name: "Alice Mwangi", branchId: b.westlands },
    { id: userId("gotieno"), name: "Grace Otieno", branchId: b.karen },
  ];

  type SaleInsert = typeof t.sales.$inferInsert;
  const saleRows: SaleInsert[] = [];
  /** Items are attached after the sales come back with ids. */
  const itemsByRef = new Map<string, { name: string; sku: string; quantity: number; unitPrice: number; productId: number }[]>();

  const push = (row: SaleInsert, items: { product: ProductRow; qty: number }[]) => {
    saleRows.push(row);
    itemsByRef.set(
      row.reference,
      items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        sku: i.product.sku,
        quantity: i.qty,
        unitPrice: i.product.sellingPrice,
      })),
    );
  };

  const bySku = new Map(products.map((p) => [p.sku, p]));

  // The seven receipts the dashboard listed verbatim.
  const todayReceipts: {
    reference: string;
    customer: string;
    method: (typeof t.paymentMethod.enumValues)[number];
    status: (typeof t.saleStatus.enumValues)[number];
    time: string;
    items: [string, number][];
  }[] = [
    { reference: "RCP-20841", customer: "Walk-in", method: "mpesa", status: "paid", time: "12:41", items: [["P-1041", 2], ["P-1046", 1], ["P-1052", 1]] },
    { reference: "RCP-20840", customer: "Halima Yusuf", method: "cash", status: "paid", time: "12:22", items: [["P-1043", 2], ["P-1050", 1]] },
    { reference: "RCP-20839", customer: "Riverside Cafe Ltd", method: "invoice", status: "pending", time: "11:58", items: [["P-1041", 6], ["P-1046", 3], ["P-1052", 12]] },
    { reference: "RCP-20838", customer: "Walk-in", method: "cash", status: "paid", time: "11:31", items: [["P-1043", 1]] },
    { reference: "RCP-20837", customer: "Peter Mwangi", method: "card", status: "paid", time: "10:47", items: [["P-1049", 4], ["P-1044", 2], ["P-1045", 3]] },
    { reference: "RCP-20836", customer: "Walk-in", method: "mpesa", status: "refunded", time: "10:12", items: [["P-1048", 2], ["P-1042", 4]] },
    { reference: "RCP-20835", customer: "Grace Otieno", method: "mpesa", status: "paid", time: "09:54", items: [["P-1046", 3], ["P-1042", 6], ["P-1050", 2]] },
  ];

  for (const r of todayReceipts) {
    const items = r.items.map(([sku, qty]) => ({ product: bySku.get(sku)!, qty }));
    const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.qty, 0);
    const customer = customerByName.get(r.customer);
    const cashier = cashiers[0];
    push(
      {
        businessId,
        branchId: b.main,
        reference: r.reference,
        customerId: customer?.id ?? null,
        customerName: r.customer,
        cashierId: cashier.id,
        cashierName: cashier.name,
        method: r.method,
        status: r.status,
        subtotal,
        taxRate: r.method === "invoice" ? 16 : 0,
        taxAmount: r.method === "invoice" ? Math.round(subtotal * 0.16) : 0,
        total: r.method === "invoice" ? subtotal + Math.round(subtotal * 0.16) : subtotal,
        amountPaid: r.status === "paid" ? subtotal : r.status === "pending" ? 15000 : 0,
        dueDate: r.method === "invoice" ? iso(day(30)) : null,
        soldAt: at(0, r.time),
      },
      items,
    );
  }

  // A week of trading history so the revenue chart and period reports are real.
  const week = [
    { offset: -6, orders: 142 },
    { offset: -5, orders: 168 },
    { offset: -4, orders: 151 },
    { offset: -3, orders: 194 },
    { offset: -2, orders: 241 },
    { offset: -1, orders: 288 },
    { offset: 0, orders: 203 },
  ];
  const methods = t.paymentMethod.enumValues.filter((m) => m !== "bank");
  const walkInNames = ["Walk-in", "Walk-in", "Walk-in", "Peter Mwangi", "Grace Otieno", "Halima Yusuf", "Nyali Hotel", "Riverside Cafe Ltd"];
  const random = rng(20260805);
  let counter = 19000;

  for (const d of week) {
    // Today's seven receipts above already stand in for part of the day.
    const count = d.offset === 0 ? d.orders - todayReceipts.length : d.orders;
    for (let i = 0; i < count; i++) {
      const itemCount = 1 + Math.floor(random() * 4);
      const items: { product: ProductRow; qty: number }[] = [];
      for (let k = 0; k < itemCount; k++) {
        const product = products[Math.floor(random() * products.length)];
        if (items.some((x) => x.product.id === product.id)) continue;
        items.push({ product, qty: 1 + Math.floor(random() * 5) });
      }
      if (!items.length) items.push({ product: products[0], qty: 1 });

      const subtotal = items.reduce((sum, x) => sum + x.product.sellingPrice * x.qty, 0);
      const cashier = cashiers[Math.floor(random() * cashiers.length)];
      const customerName = walkInNames[Math.floor(random() * walkInNames.length)];
      const customer = customerByName.get(customerName);
      const hour = 7 + Math.floor(random() * 12);
      const minute = Math.floor(random() * 60);

      push(
        {
          businessId,
          branchId: cashier.branchId,
          reference: `RCP-${counter++}`,
          customerId: customer?.id ?? null,
          customerName,
          cashierId: cashier.id,
          cashierName: cashier.name,
          method: methods[Math.floor(random() * methods.length)],
          status: random() < 0.94 ? "paid" : random() < 0.5 ? "pending" : "refunded",
          subtotal,
          taxRate: 0,
          taxAmount: 0,
          total: subtotal,
          amountPaid: subtotal,
          soldAt: at(d.offset, `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`),
        },
        items,
      );
    }
  }

  const inserted: { id: number; reference: string }[] = [];
  for (const part of chunk(saleRows, 400)) {
    const rows = await db
      .insert(t.sales)
      .values(part)
      .returning({ id: t.sales.id, reference: t.sales.reference });
    inserted.push(...rows);
  }

  const itemRows = inserted.flatMap((s) =>
    (itemsByRef.get(s.reference) ?? []).map((i) => ({ saleId: s.id, ...i })),
  );
  await insertAll(t.saleItems, itemRows);

  console.log(`  ${inserted.length} sales, ${itemRows.length} line items`);
  return inserted;
}

async function seedAccounting(
  businessId: number,
  b: Awaited<ReturnType<typeof seedBranches>>,
  userId: (key: string) => string,
) {
  console.log("• accounting");
  const accounts = await db
    .insert(t.ledgerAccounts)
    .values([
      { businessId, name: "Cash in Hand", type: "asset" as const, openingBalance: 50000 },
      { businessId, name: "Bank — Equity Bank", type: "asset" as const, openingBalance: 200000 },
      { businessId, name: "Inventory", type: "asset" as const, openingBalance: 4180000 },
      { businessId, name: "Accounts Payable", type: "liability" as const, openingBalance: 257700 },
      { businessId, name: "Sales Revenue", type: "income" as const, openingBalance: 0 },
      { businessId, name: "Rent Expense", type: "expense" as const, openingBalance: 0 },
      { businessId, name: "Utilities Expense", type: "expense" as const, openingBalance: 0 },
      { businessId, name: "Owner's Equity", type: "equity" as const, openingBalance: 3000000 },
    ])
    .returning();

  const acc = new Map(accounts.map((a) => [a.name, a.id]));

  await insertAll(t.ledgerEntries, [
    { accountId: acc.get("Cash in Hand")!, entryDate: iso(day(-65)), description: "Sale Invoice #RCP-20835", debit: 2870, credit: 0 },
    { accountId: acc.get("Cash in Hand")!, entryDate: iso(day(-62)), description: "Electricity (KPLC)", debit: 0, credit: 23400 },
    { accountId: acc.get("Cash in Hand")!, entryDate: iso(day(-59)), description: "Delivery fuel", debit: 0, credit: 18700 },
    { accountId: acc.get("Cash in Hand")!, entryDate: iso(day(-57)), description: "Sale Invoice #RCP-20840", debit: 4380, credit: 0 },
    { accountId: acc.get("Sales Revenue")!, entryDate: iso(day(-65)), description: "Sale Invoice #RCP-20835", debit: 2870, credit: 0 },
    { accountId: acc.get("Sales Revenue")!, entryDate: iso(day(-61)), description: "Sale Invoice #RCP-20838", debit: 320, credit: 0 },
    { accountId: acc.get("Sales Revenue")!, entryDate: iso(day(-57)), description: "Sale Invoice #RCP-20840", debit: 4380, credit: 0 },
    { accountId: acc.get("Rent Expense")!, entryDate: iso(day(-65)), description: "Branch rent — June", debit: 145000, credit: 0 },
  ]);

  await insertAll(t.transactions, [
    { businessId, branchId: b.main, entryDate: iso(day(-57)), type: "income" as const, description: "Sale Invoice #RCP-20840", amount: 4380, handledById: userId("jkamau"), handledByName: "James Kamau" },
    { businessId, branchId: b.mombasa, entryDate: iso(day(-59)), type: "expense" as const, description: "Logistics — Delivery fuel", amount: 18700, handledById: userId("asaid"), handledByName: "Aisha Said" },
    { businessId, branchId: b.main, entryDate: iso(day(-61)), type: "income" as const, description: "Sale Invoice #RCP-20839", amount: 26400, handledById: userId("jkamau"), handledByName: "James Kamau" },
    { businessId, branchId: b.kisumu, entryDate: iso(day(-62)), type: "expense" as const, description: "Utilities — Electricity (KPLC)", amount: 23400, handledById: userId("bochieng"), handledByName: "Brian Ochieng" },
    { businessId, branchId: b.main, entryDate: iso(day(-65)), type: "expense" as const, description: "Rent — Branch rent June", amount: 145000, handledById: userId("jkamau"), handledByName: "James Kamau" },
  ]);

  await insertAll(t.expenses, [
    { businessId, branchId: b.main, reference: "EXP-3391", label: "Branch rent — June", category: "Rent", amount: 145000, incurredOn: iso(day(-65)), handledById: userId("jkamau") },
    { businessId, branchId: b.kisumu, reference: "EXP-3392", label: "Electricity (KPLC)", category: "Utilities", amount: 23400, incurredOn: iso(day(-62)), handledById: userId("bochieng") },
    { businessId, branchId: b.mombasa, reference: "EXP-3393", label: "Delivery fuel", category: "Logistics", amount: 18700, incurredOn: iso(day(-59)), handledById: userId("asaid") },
    { businessId, branchId: b.main, reference: "EXP-3394", label: "Casual staff wages", category: "Payroll", amount: 64000, incurredOn: iso(day(-57)), handledById: userId("jkamau") },
  ]);

  await insertAll(t.cashBookEntries, [
    { businessId, entryDate: iso(day(-65)), particulars: "Opening balance", cashIn: 50000, bankIn: 200000, cashOut: 0, bankOut: 0, source: "Manual Entry" },
    { businessId, entryDate: iso(day(-65)), particulars: "Branch rent — June", cashIn: 0, bankIn: 0, cashOut: 0, bankOut: 145000, source: "Expenses" },
    { businessId, entryDate: iso(day(-61)), particulars: "Cash Sale Invoice #RCP-20838", cashIn: 320, bankIn: 0, cashOut: 0, bankOut: 0, source: "Sales" },
    { businessId, entryDate: iso(day(-59)), particulars: "Logistics — Delivery fuel", cashIn: 0, bankIn: 0, cashOut: 18700, bankOut: 0, source: "Expenses" },
    { businessId, entryDate: iso(day(-57)), particulars: "Cash Sale Invoice #RCP-20840", cashIn: 4380, bankIn: 0, cashOut: 0, bankOut: 0, source: "Sales" },
  ]);

  await insertAll(t.pettyCashActions, [
    { businessId, action: "add" as const, amount: 20000, approvedByName: "James Kamau", actedAt: at(-65, "09:12") },
    { businessId, action: "remove" as const, amount: 3500, approvedByName: "James Kamau", actedAt: at(-63, "14:20") },
    { businessId, action: "add" as const, amount: 10000, approvedByName: "Aisha Said", actedAt: at(-60, "10:05") },
  ]);

  await insertAll(t.pettyCashTransactions, [
    { businessId, branchId: b.main, entryDate: iso(day(-64)), name: "Peter Mwangi", purpose: "company" as const, reason: "Office supplies", amount: 1200, balance: 0, approvedByName: "James Kamau" },
    { businessId, branchId: b.main, entryDate: iso(day(-62)), name: "Grace Otieno", purpose: "personal" as const, reason: "Advance", amount: 3000, balance: 1500, approvedByName: "James Kamau" },
    { businessId, branchId: b.kisumu, entryDate: iso(day(-60)), name: "Brian Ochieng", purpose: "company" as const, reason: "Cleaning supplies", amount: 800, balance: 0, approvedByName: "Brian Ochieng" },
  ]);
}

async function seedHr(
  businessId: number,
  b: Awaited<ReturnType<typeof seedBranches>>,
  userId: (key: string) => string,
) {
  console.log("• employees + payroll");
  const employees = await db
    .insert(t.employees)
    .values([
      { businessId, branchId: b.main, userId: userId("jkamau"), name: "James Kamau", email: "jkamau@meridianpos.co.ke", phone: "0712 334 551", position: "Branch Manager", baseSalary: 85000, hireDate: "2022-03-14", status: "active" as const },
      { businessId, branchId: b.westlands, userId: userId("amwangi"), name: "Alice Mwangi", email: "amwangi@meridianpos.co.ke", phone: "0722 118 902", position: "Cashier", baseSalary: 38000, hireDate: "2023-06-01", status: "active" as const },
      { businessId, branchId: b.karen, userId: userId("gotieno"), name: "Grace Otieno", email: "gotieno@meridianpos.co.ke", phone: "0733 445 210", position: "Sales Associate", baseSalary: 42000, hireDate: "2021-11-20", status: "active" as const },
      { businessId, branchId: b.mombasa, userId: userId("hyusuf"), name: "Halima Yusuf", email: "hyusuf@meridianpos.co.ke", phone: "0700 992 341", position: "Stock Controller", baseSalary: 48000, hireDate: "2020-08-05", status: "inactive" as const },
      { businessId, branchId: b.main, userId: null, name: "Peter Njoroge", email: "peter.njoroge@gmail.com", phone: "0711 776 654", position: "Cleaner", baseSalary: 22000, hireDate: "2024-01-10", status: "active" as const },
    ])
    .returning();

  const payroll = [
    { idx: 0, month: PREV_MONTH, baseSalary: 85000, transport: 8000, housing: 15000, medical: 4000, overtime: 2000, nssf: 5000, tax: 12500, loan: 0, otherDeductions: 0, status: "paid" as const },
    { idx: 1, month: PREV_MONTH, baseSalary: 38000, transport: 3000, housing: 5000, medical: 1500, overtime: 1200, nssf: 2160, tax: 4300, loan: 2000, otherDeductions: 500, status: "paid" as const },
    { idx: 2, month: THIS_MONTH, baseSalary: 42000, transport: 3000, housing: 6000, medical: 1500, overtime: 800, nssf: 2160, tax: 4900, loan: 0, otherDeductions: 0, status: "pending" as const },
    { idx: 3, month: THIS_MONTH, baseSalary: 48000, transport: 3500, housing: 6500, medical: 1800, overtime: 0, nssf: 2160, tax: 5700, loan: 1500, otherDeductions: 0, status: "pending" as const },
  ];

  await insertAll(
    t.payrollRecords,
    payroll.map((p) => {
      const gross = p.baseSalary + p.transport + p.housing + p.medical + p.overtime;
      const net = gross - (p.nssf + p.tax + p.loan + p.otherDeductions);
      const { idx, ...rest } = p;
      return { employeeId: employees[idx].id, ...rest, gross, net };
    }),
  );

  return employees;
}

async function seedOperations(
  businessId: number,
  b: Awaited<ReturnType<typeof seedBranches>>,
  customers: Awaited<ReturnType<typeof seedCustomers>>,
  products: ProductRow[],
  userId: (key: string) => string,
) {
  console.log("• remote orders, proofs, tills, debtors");
  const bySku = new Map(products.map((p) => [p.sku, p]));

  const orderSeed: {
    reference: string;
    branchId: number;
    customerName: string;
    phone: string;
    location: string;
    paymentMethod: string;
    status: (typeof t.remoteOrderStatus.enumValues)[number];
    placedAt: Date;
    items: [string, number][];
  }[] = [
    { reference: "ORD-2026-10841", branchId: b.westlands, customerName: "Amina Hassan", phone: "0722 445 610", location: "Parklands Rd", paymentMethod: "M-Pesa", status: "pending", placedAt: at(0, "09:12"), items: [["P-1041", 2], ["P-1042", 4]] },
    { reference: "ORD-2026-10840", branchId: b.main, customerName: "Brian Otieno", phone: "0711 220 984", location: "Moi Avenue", paymentMethod: "M-Pesa", status: "pending", placedAt: at(0, "08:47"), items: [["P-1049", 1]] },
    { reference: "ORD-2026-10839", branchId: b.karen, customerName: "Faith Njoroge", phone: "0733 908 221", location: "Karen Rd", paymentMethod: "Cash on delivery", status: "finished", placedAt: at(-1, "17:35"), items: [["P-1051", 3], ["P-1048", 2]] },
    { reference: "ORD-2026-10838", branchId: b.kilimani, customerName: "Dennis Kiptoo", phone: "0798 004 452", location: "Yaya Centre", paymentMethod: "M-Pesa", status: "cancelled", placedAt: at(-1, "15:02"), items: [["P-1044", 2]] },
    { reference: "ORD-2026-10837", branchId: b.westlands, customerName: "Grace Wambui", phone: "0700 512 887", location: "Westlands", paymentMethod: "M-Pesa", status: "finished", placedAt: at(-1, "12:20"), items: [["P-1045", 5]] },
    { reference: "ORD-88213", branchId: b.westlands, customerName: "Mercy Wanjiru", phone: "0712 334 556", location: "Westlands", paymentMethod: "M-Pesa", status: "pending", placedAt: at(0, "09:14"), items: [["P-1043", 4]] },
    { reference: "ORD-88214", branchId: b.main, customerName: "Dennis Otieno", phone: "0798 221 004", location: "Nairobi CBD", paymentMethod: "Cash on delivery", status: "pending", placedAt: at(0, "10:02"), items: [["P-1046", 2]] },
    { reference: "ORD-88215", branchId: b.karen, customerName: "Aisha Noor", phone: "0733 890 221", location: "Karen", paymentMethod: "M-Pesa", status: "pending", placedAt: at(0, "10:41"), items: [["P-1049", 5], ["P-1045", 2]] },
  ];

  const orders = await db
    .insert(t.remoteOrders)
    .values(
      orderSeed.map((o) => ({
        businessId,
        branchId: o.branchId,
        reference: o.reference,
        customerName: o.customerName,
        phone: o.phone,
        deliveryLocation: o.location,
        paymentMethod: o.paymentMethod,
        amount: o.items.reduce((sum, [sku, qty]) => sum + bySku.get(sku)!.sellingPrice * qty, 0),
        status: o.status,
        placedAt: o.placedAt,
      })),
    )
    .returning();

  const orderByRef = new Map(orders.map((o) => [o.reference, o]));

  await insertAll(
    t.remoteOrderItems,
    orderSeed.flatMap((o) =>
      o.items.map(([sku, qty]) => {
        const product = bySku.get(sku)!;
        return {
          orderId: orderByRef.get(o.reference)!.id,
          productId: product.id,
          name: product.name,
          quantity: qty,
          unitPrice: product.sellingPrice,
        };
      }),
    ),
  );

  await insertAll(t.paymentProofs, [
    { businessId, orderId: orderByRef.get("ORD-2026-10841")!.id, reference: "ORD-2026-10841", branchId: b.westlands, customerName: "Amina Hassan", phone: "0722 445 610", location: "Parklands Rd", method: "mtn_merchant" as const, status: "pending" as const, submittedAt: at(0, "09:14") },
    { businessId, orderId: null, reference: "ORD-2026-10833", branchId: b.main, customerName: "Samuel Kariuki", phone: "0788 231 004", location: "Moi Avenue", method: "airtel_merchant" as const, status: "verified" as const, submittedAt: at(-1, "19:02") },
    { businessId, orderId: null, reference: "ORD-2026-10829", branchId: b.karen, customerName: "Lucy Adhiambo", phone: "0722 900 331", location: "Karen Rd", method: "mtn_merchant" as const, status: "rejected" as const, submittedAt: at(-1, "11:44") },
    { businessId, orderId: null, reference: "ORD-2026-10826", branchId: b.kilimani, customerName: "Peter Mwangi", phone: "0711 550 219", location: "Yaya Centre", method: "airtel_merchant" as const, status: "pending" as const, submittedAt: at(-2, "16:20") },
  ]);

  const tills = await db
    .insert(t.tills)
    .values([
      { businessId, branchId: b.westlands, name: "Till 01", staffId: userId("jkamau"), staffName: "James Kamau", phone: "0712 345 601", balance: 48200, createdAt: at(-35, "08:00") },
      { businessId, branchId: b.main, name: "Till 02", staffId: null, staffName: "Mary Achieng", phone: "0722 887 452", balance: 132400, createdAt: at(-33, "08:00") },
      { businessId, branchId: b.karen, name: "Till 03", staffId: userId("gotieno"), staffName: "Kevin Otieno", phone: "0733 221 987", balance: 21750, createdAt: at(-26, "08:00") },
      { businessId, branchId: b.kilimani, name: "Till 04", staffId: null, staffName: "Nancy Wanjiru", phone: "0798 442 110", balance: 67900, createdAt: at(-21, "08:00") },
    ])
    .returning();

  const tillByName = new Map(tills.map((x) => [x.name, x.id]));
  await insertAll(t.tillRemovals, [
    { tillId: tillByName.get("Till 02")!, amount: 50000, approvedByName: "Manager: John Mutua", balanceAfter: 82400, removedAt: at(-1, "18:00") },
    { tillId: tillByName.get("Till 01")!, amount: 20000, approvedByName: "Manager: John Mutua", balanceAfter: 28200, removedAt: at(-2, "19:20") },
  ]);

  const debtors = await db
    .insert(t.debtors)
    .values([
      { businessId, branchId: b.main, name: "Tom Mboya Kiosk", phone: "0711 998 220", itemTaken: "Rice 5kg x3, Sugar 2kg x5", quantity: 8, amountPaid: 2000, balance: 5470, dueDate: at(-5, "12:00"), recordedAt: at(-4, "10:00") },
      { businessId, branchId: b.westlands, name: "Corner Shop Ruaka", phone: "0733 441 908", itemTaken: "Cooking Oil 3L x4", quantity: 4, amountPaid: 1000, balance: 2120, dueDate: at(-3, "12:00"), recordedAt: at(-6, "11:00") },
      { businessId, branchId: b.kilimani, name: "Mama Ntilie Kilimani", phone: "0700 213 887", itemTaken: "Flour 2kg x10", quantity: 10, amountPaid: 500, balance: 1600, dueDate: at(-2, "12:00"), recordedAt: at(-7, "09:30") },
      { businessId, branchId: b.westlands, name: "John Kamau", phone: "0722 445 981", itemTaken: "Assorted groceries", quantity: 12, amountPaid: 800, balance: 4200, dueDate: at(-8, "12:00"), recordedAt: at(-12, "14:00") },
      { businessId, branchId: b.main, name: "Faith Njeri", phone: "0733 210 442", itemTaken: "Detergent 2L x3", quantity: 3, amountPaid: 60, balance: 1800, dueDate: at(-4, "12:00"), recordedAt: at(-9, "16:00") },
    ])
    .returning();

  await insertAll(t.debtorPayments, [
    { debtorId: debtors[0].id, amount: 2000, balanceAfter: 5470, recordedById: userId("jkamau"), paidAt: at(-3, "11:20") },
    { debtorId: debtors[1].id, amount: 1000, balanceAfter: 2120, recordedById: userId("amwangi"), paidAt: at(-2, "09:45") },
  ]);

  return { orders, customers, debtors };
}

async function seedSystem(businessId: number, b: Awaited<ReturnType<typeof seedBranches>>) {
  console.log("• sms, notifications, system logs");
  await insertAll(t.smsLogs, [
    { businessId, recipient: "0722 445 981", message: "Products about to expire: Fresh Milk 500ml — 2026-08-08", status: "sent" as const, sentAt: at(0, "07:00") },
    { businessId, recipient: "0722 445 981", message: "Products about to expire: Cheddar Block 400g — 2026-08-10", status: "sent" as const, sentAt: at(0, "07:00") },
    { businessId, recipient: "0733 210 442", message: "Low stock alert: Brown Sugar 2kg (8 left)", status: "queued" as const, sentAt: at(0, "08:15") },
    { businessId, recipient: "0700 998 112", message: "Reorder reminder sent for Kilimani branch", status: "failed" as const, sentAt: at(-1, "18:30") },
  ]);

  await insertAll(t.systemLogs, [
    { actor: "Super Admin", message: "Uploaded update file: pos-patch-2.3.1.zip", createdAt: at(-6, "08:12") },
    { actor: "Super Admin", message: "Created database backup: db_backup_2026_07_30_214755.sql", createdAt: at(-7, "21:47") },
    { actor: "Super Admin", message: "Cleared system logs", createdAt: at(-8, "10:03") },
    { actor: "Super Admin", message: "Cleared cache", createdAt: at(-9, "16:22") },
    { actor: "Super Admin", message: "Uploaded update file: inventory-module-1.0.4.sql", createdAt: at(-11, "09:14") },
    { actor: "Super Admin", message: "Created database backup: db_backup_2026_07_22_135819.sql", createdAt: at(-15, "13:58") },
  ]);

  await insertAll(t.systemUpdates, [
    { fileName: "pos-patch-2.3.1.zip", notes: "Receipt printing fixes and till reconciliation patch.", uploadedAt: at(-6, "08:12") },
    { fileName: "inventory-module-1.0.4.sql", notes: "Adds expiry tracking columns to stock tables.", uploadedAt: at(-11, "09:14") },
  ]);
}

async function main() {
  console.log("Seeding Neon…\n");
  await reset();

  const { meridianId, tenants } = await seedBusinesses();
  await seedModules(meridianId, tenants);
  const branches = await seedBranches(meridianId);

  const userId = await seedUsers([
    { key: "super", name: "Meridian Super Admin", email: "super@meridianpos.co.ke", username: "superadmin", phone: "0700 000 000", role: "super", businessId: null, branchId: null },
    { key: "admin", name: "Meridian Admin", email: "admin@meridianpos.co.ke", username: "admin", phone: "0700 000 001", role: "admin", businessId: meridianId, branchId: null },
    { key: "jkamau", name: "James Kamau", email: "jkamau@meridianpos.co.ke", username: "jkamau", phone: "0712 334 551", role: "manager", businessId: meridianId, branchId: branches.main },
    { key: "amwangi", name: "Alice Mwangi", email: "amwangi@meridianpos.co.ke", username: "amwangi", phone: "0722 118 902", role: "staff", businessId: meridianId, branchId: branches.westlands },
    { key: "gotieno", name: "Grace Otieno", email: "gotieno@meridianpos.co.ke", username: "gotieno", phone: "0733 445 210", role: "staff", businessId: meridianId, branchId: branches.karen },
    { key: "hyusuf", name: "Halima Yusuf", email: "hyusuf@meridianpos.co.ke", username: "hyusuf", phone: "0700 992 341", role: "staff", status: "suspended", businessId: meridianId, branchId: branches.mombasa },
    { key: "asaid", name: "Aisha Said", email: "asaid@meridianpos.co.ke", username: "asaid", phone: "0722 118 004", role: "manager", businessId: meridianId, branchId: branches.mombasa },
    { key: "bochieng", name: "Brian Ochieng", email: "bochieng@meridianpos.co.ke", username: "bochieng", phone: "0733 220 118", role: "manager", businessId: meridianId, branchId: branches.kisumu },
    { key: "lwanjiru", name: "Lucy Wanjiru", email: "lwanjiru@meridianpos.co.ke", username: "lwanjiru", phone: "0711 552 003", role: "manager", businessId: meridianId, branchId: branches.kilimani },

    // Tenant admins for the super-admin console.
    { key: "tenant1", name: "Njeri Wambui", email: "njeri@mamanjeri.co.ke", username: "njeri", phone: "0722 341 908", role: "admin", businessId: tenants[0].id, branchId: null },
    { key: "tenant2", name: "David Kariuki", email: "david@kilimanifresh.co.ke", username: "dkariuki", phone: "0733 214 771", role: "admin", businessId: tenants[1].id, branchId: null },
    { key: "tenant3", name: "Abdi Hassan", email: "abdi@eastleightraders.co.ke", username: "ahassan", phone: "0711 902 344", role: "admin", status: "suspended", businessId: tenants[2].id, branchId: null },
    { key: "tenant4", name: "Grace Mwikali", email: "grace@westsidepharm.co.ke", username: "gmwikali", phone: "0700 556 812", role: "admin", businessId: tenants[3].id, branchId: null },
    { key: "tenant6", name: "Samuel Otieno", email: "samuel@rongaihardware.co.ke", username: "sotieno", phone: "0721 443 908", role: "admin", status: "suspended", businessId: tenants[5].id, branchId: null },
    { key: "tenant7", name: "Amina Farah", email: "amina@karenboutique.co.ke", username: "afarah", phone: "0798 302 156", role: "admin", businessId: tenants[6].id, branchId: null },
  ]);

  const { products } = await seedCatalog(meridianId, branches);
  const customers = await seedCustomers(meridianId);
  await seedSales(meridianId, branches, products, customers, userId);
  await seedAccounting(meridianId, branches, userId);
  await seedHr(meridianId, branches, userId);
  await seedOperations(meridianId, branches, customers, products, userId);
  await seedSystem(meridianId, branches);

  console.log(`\nDone. Sign in with any seeded email and password "${SEED_PASSWORD}".`);
  console.log("  super@meridianpos.co.ke   — super admin console");
  console.log("  admin@meridianpos.co.ke   — business admin");
  console.log("  jkamau@meridianpos.co.ke  — branch manager");
  console.log("  amwangi@meridianpos.co.ke — cashier/staff");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exit(1);
  });
