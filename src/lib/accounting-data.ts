export const accounts = [
  { id: 1, name: "Cash in Hand", type: "asset" },
  { id: 2, name: "Bank — Equity Bank", type: "asset" },
  { id: 3, name: "Inventory", type: "asset" },
  { id: 4, name: "Accounts Payable", type: "liability" },
  { id: 5, name: "Sales Revenue", type: "income" },
  { id: 6, name: "Rent Expense", type: "expense" },
  { id: 7, name: "Utilities Expense", type: "expense" },
  { id: 8, name: "Owner's Equity", type: "liability" },
];

export const ledgerEntries: Record<number, { date: string; description: string; debit: number; credit: number }[]> = {
  1: [
    { date: "01 Jun", description: "Sale Invoice #RCP-20835", debit: 2870, credit: 0 },
    { date: "04 Jun", description: "Electricity (KPLC)", debit: 0, credit: 23400 },
    { date: "07 Jun", description: "Delivery fuel", debit: 0, credit: 18700 },
    { date: "09 Jun", description: "Sale Invoice #RCP-20840", debit: 4380, credit: 0 },
  ],
  5: [
    { date: "01 Jun", description: "Sale Invoice #RCP-20835", debit: 2870, credit: 0 },
    { date: "05 Jun", description: "Sale Invoice #RCP-20838", debit: 320, credit: 0 },
    { date: "09 Jun", description: "Sale Invoice #RCP-20840", debit: 4380, credit: 0 },
  ],
  6: [{ date: "01 Jun", description: "Branch rent — June", debit: 145000, credit: 0 }],
};

export const transactionsFeed = [
  { date: "09 Jun", type: "Income", description: "Sale Invoice #RCP-20840", branch: "Nairobi — Main", amount: 4380, handledBy: "James Kariuki" },
  { date: "07 Jun", type: "Expense", description: "Logistics - Delivery fuel", branch: "Mombasa — Nyali", amount: -18700, handledBy: "Aisha Said" },
  { date: "05 Jun", type: "Income", description: "Sale Invoice #RCP-20839", branch: "Nairobi — Main", amount: 26400, handledBy: "James Kariuki" },
  { date: "04 Jun", type: "Expense", description: "Utilities - Electricity (KPLC)", branch: "Kisumu — Oginga", amount: -23400, handledBy: "Brian Ochieng" },
  { date: "01 Jun", type: "Expense", description: "Rent - Branch rent June", branch: "Nairobi — Main", amount: -145000, handledBy: "James Kariuki" },
];

export const cashBookEntries = [
  { date: "01 Jun", particulars: "Opening balance", cashIn: 50000, bankIn: 200000, cashOut: 0, bankOut: 0, source: "Manual Entry" },
  { date: "01 Jun", particulars: "Branch rent — June", cashIn: 0, bankIn: 0, cashOut: 0, bankOut: 145000, source: "Expenses" },
  { date: "05 Jun", particulars: "Cash Sale Invoice #RCP-20838", cashIn: 320, bankIn: 0, cashOut: 0, bankOut: 0, source: "Sales" },
  { date: "07 Jun", particulars: "Logistics - Delivery fuel", cashIn: 0, bankIn: 0, cashOut: 18700, bankOut: 0, source: "Expenses" },
  { date: "09 Jun", particulars: "Cash Sale Invoice #RCP-20840", cashIn: 4380, bankIn: 0, cashOut: 0, bankOut: 0, source: "Sales" },
];

export const pettyCashBalanceActions = [
  { date: "01 Jun 09:12", action: "add", amount: 20000, approvedBy: "James Kariuki" },
  { date: "03 Jun 14:20", action: "remove", amount: 3500, approvedBy: "James Kariuki" },
  { date: "06 Jun 10:05", action: "add", amount: 10000, approvedBy: "Aisha Said" },
];

export const pettyCashTransactions = [
  { id: 1, date: "02 Jun", name: "Peter Mwangi", branch: "Nairobi — Main", purpose: "company", reason: "Office supplies", amount: 1200, balance: 0, approvedBy: "James Kariuki" },
  { id: 2, date: "04 Jun", name: "Grace Otieno", branch: "Nairobi — Main", purpose: "personal", reason: "Advance", amount: 3000, balance: 1500, approvedBy: "James Kariuki" },
  { id: 3, date: "06 Jun", name: "Brian Ochieng", branch: "Kisumu — Oginga", purpose: "company", reason: "Cleaning supplies", amount: 800, balance: 0, approvedBy: "Brian Ochieng" },
];

export const invoicePreview = {
  invoiceNo: "RCP-20841",
  date: "05 Aug 2026",
  dueDate: "04 Sep 2026",
  company: { name: "Meridian Traders Ltd", tagline: "Nairobi's trusted general supplies", address: "Kimathi Street, Nairobi CBD", pin: "P051234567X" },
  customer: { name: "Riverside Cafe", email: "accounts@riversidecafe.co.ke", contact: "0722 445 108" },
  items: [
    { id: "P-1041", name: "Arabica Beans 1kg", qty: 6, price: 1850 },
    { id: "P-1046", name: "Green Tea 100 bags", qty: 3, price: 540 },
    { id: "P-1052", name: "Yoghurt 250ml", qty: 12, price: 90 },
  ],
  taxRate: 16,
  amountPaid: 15000,
};