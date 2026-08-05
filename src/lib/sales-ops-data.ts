export const currency = (n: number) =>
  "KSh " + n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const branches = ["Westlands", "CBD", "Karen", "Kilimani"];

export type RemoteOrder = {
  ref: string;
  date: string;
  branch: string;
  customer: string;
  phone: string;
  items: { name: string; qty: number; price: number }[];
  amount: number;
  status: "Pending" | "Finished" | "Cancelled";
};

export const remoteOrders: RemoteOrder[] = [
  { ref: "ORD-2026-10841", date: "05 Aug 2026, 09:12", branch: "Westlands", customer: "Amina Hassan", phone: "0722 445 610", items: [{ name: "Arabica Beans 1kg", qty: 2, price: 1850 }, { name: "Fresh Milk 500ml", qty: 4, price: 65 }], amount: 3960, status: "Pending" },
  { ref: "ORD-2026-10840", date: "05 Aug 2026, 08:47", branch: "CBD", customer: "Brian Otieno", phone: "0711 220 984", items: [{ name: "Rice Pishori 5kg", qty: 1, price: 1290 }], amount: 1290, status: "Pending" },
  { ref: "ORD-2026-10839", date: "04 Aug 2026, 17:35", branch: "Karen", customer: "Faith Njoroge", phone: "0733 908 221", items: [{ name: "Detergent 2L", qty: 3, price: 620 }, { name: "Bar Soap 6pk", qty: 2, price: 450 }], amount: 2760, status: "Finished" },
  { ref: "ORD-2026-10838", date: "04 Aug 2026, 15:02", branch: "Kilimani", customer: "Dennis Kiptoo", phone: "0798 004 452", items: [{ name: "Sunflower Oil 3L", qty: 2, price: 780 }], amount: 1560, status: "Cancelled" },
  { ref: "ORD-2026-10837", date: "04 Aug 2026, 12:20", branch: "Westlands", customer: "Grace Wambui", phone: "0700 512 887", items: [{ name: "Wheat Flour 2kg", qty: 5, price: 210 }], amount: 1050, status: "Finished" },
];

export type PaymentProof = {
  ref: string;
  branch: string;
  customer: string;
  phone: string;
  location: string;
  method: "MTN Merchant" | "Airtel Merchant";
  status: "Pending" | "Verified" | "Rejected";
  date: string;
};

export const paymentProofs: PaymentProof[] = [
  { ref: "ORD-2026-10841", branch: "Westlands", customer: "Amina Hassan", phone: "0722 445 610", location: "Parklands Rd", method: "MTN Merchant", status: "Pending", date: "05 Aug 2026, 09:14" },
  { ref: "ORD-2026-10833", branch: "CBD", customer: "Samuel Kariuki", phone: "0788 231 004", location: "Moi Avenue", method: "Airtel Merchant", status: "Verified", date: "04 Aug 2026, 19:02" },
  { ref: "ORD-2026-10829", branch: "Karen", customer: "Lucy Adhiambo", phone: "0722 900 331", location: "Karen Rd", method: "MTN Merchant", status: "Rejected", date: "04 Aug 2026, 11:44" },
  { ref: "ORD-2026-10826", branch: "Kilimani", customer: "Peter Mwangi", phone: "0711 550 219", location: "Yaya Centre", method: "Airtel Merchant", status: "Pending", date: "03 Aug 2026, 16:20" },
];

export type Till = {
  id: number;
  name: string;
  branch: string;
  staff: string;
  phone: string;
  created: string;
  balance: number;
};

export const tills: Till[] = [
  { id: 1, name: "Till 01", branch: "Westlands", staff: "James Kariuki", phone: "0712 345 601", created: "01 Jul 2026", balance: 48200 },
  { id: 2, name: "Till 02", branch: "CBD", staff: "Mary Achieng", phone: "0722 887 452", created: "03 Jul 2026", balance: 132400 },
  { id: 3, name: "Till 03", branch: "Karen", staff: "Kevin Otieno", phone: "0733 221 987", created: "10 Jul 2026", balance: 21750 },
  { id: 4, name: "Till 04", branch: "Kilimani", staff: "Nancy Wanjiru", phone: "0798 442 110", created: "15 Jul 2026", balance: 67900 },
];

export const tillRemovals = [
  { id: 1, till: "Till 02", amount: 50000, approvedBy: "Manager: John Mutua", balanceAfter: 82400, date: "04 Aug 2026, 18:00" },
  { id: 2, till: "Till 01", amount: 20000, approvedBy: "Manager: John Mutua", balanceAfter: 28200, date: "03 Aug 2026, 19:20" },
];

export type Customer = {
  id: number;
  name: string;
  contact: string;
  email: string;
  paymentMethod: string;
  openingDate: string;
  accountBalance: number;
  amountCredited: number;
};

export const customer: Customer = {
  id: 101,
  name: "Riverside Cafe Ltd",
  contact: "0722 556 890",
  email: "accounts@riversidecafe.co.ke",
  paymentMethod: "M-Pesa / Invoice",
  openingDate: "12 Jan 2026",
  accountBalance: 18400,
  amountCredited: 42200,
};

export const customerTransactions = [
  { date: "05 Aug 2026, 09:40", branch: "Westlands", ref: "RCP-20841", products: "Arabica Beans x2, Milk x4", paid: 3960, credited: 0, status: "paid" },
  { date: "28 Jul 2026, 14:12", branch: "Westlands", ref: "RCP-20790", products: "Sugar 2kg x5", credited: 1600, paid: 0, status: "pending" },
  { date: "20 Jul 2026, 11:05", branch: "CBD", ref: "RCP-20711", products: "Rice 5kg x10", paid: 12900, credited: 0, status: "paid" },
  { date: "12 Jul 2026, 10:00", branch: "Westlands", ref: "RCP-20655", products: "Cooking Oil 3L x8", credited: 6240, paid: 0, status: "pending" },
];

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

export const debtors: Debtor[] = [
  { id: 1, name: "Tom Mboya Kiosk", phone: "0711 998 220", itemTaken: "Rice 5kg x3, Sugar 2kg x5", quantity: 8, amountPaid: 2000, balance: 5470, branch: "CBD", date: "01 Aug 2026" },
  { id: 2, name: "Corner Shop Ruaka", phone: "0733 441 908", itemTaken: "Cooking Oil 3L x4", quantity: 4, amountPaid: 1000, balance: 2120, branch: "Westlands", date: "30 Jul 2026" },
  { id: 3, name: "Mama Ntilie Kilimani", phone: "0700 213 887", itemTaken: "Flour 2kg x10", quantity: 10, amountPaid: 500, balance: 1600, branch: "Kilimani", date: "29 Jul 2026" },
];

export const receiptSample = {
  invoiceNo: "RP-00842",
  date: "05 Aug 2026, 14:22",
  customerName: "Walk-in",
  cashier: "James Kariuki",
  method: "M-Pesa",
  items: [
    { name: "Arabica Beans 1kg", qty: 2, price: 1850 },
    { name: "Fresh Milk 500ml", qty: 4, price: 65 },
    { name: "Brown Sugar 2kg", qty: 1, price: 320 },
  ],
};

export const trackableOrder = {
  ref: "ORD-2026-10841",
  customer: "Amina Hassan",
  amount: 3960,
  status: "pending" as "pending" | "finished" | "cancelled",
  items: [
    { name: "Arabica Beans 1kg", qty: 2, subtotal: 3700 },
    { name: "Fresh Milk 500ml", qty: 4, subtotal: 260 },
  ],
};

export const storefrontProducts = [
  { id: 1, name: "Arabica Beans 1kg", price: 1850, stock: 42, branch: "Westlands" },
  { id: 2, name: "Fresh Milk 500ml", price: 65, stock: 180, branch: "Westlands" },
  { id: 3, name: "Brown Sugar 2kg", price: 320, stock: 8, branch: "CBD" },
  { id: 4, name: "Sunflower Oil 3L", price: 780, stock: 26, branch: "CBD" },
  { id: 5, name: "Wheat Flour 2kg", price: 210, stock: 64, branch: "Karen" },
  { id: 6, name: "Rice Pishori 5kg", price: 1290, stock: 19, branch: "Kilimani" },
];