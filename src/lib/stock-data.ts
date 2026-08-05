export const currency = (n: number) =>
  "KSh " + n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const branches = ["All branches", "Westlands", "CBD", "Kilimani", "Karen"];

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

export const stockProducts: StockProduct[] = [
  { id: 101, name: "Arabica Beans 1kg", category: "Beverages", sellingPrice: 1850, buyingPrice: 1400, stock: 42, branch: "Westlands", expiryDate: "2026-08-14" },
  { id: 102, name: "Fresh Milk 500ml", category: "Dairy", sellingPrice: 65, buyingPrice: 48, stock: 180, branch: "CBD", expiryDate: "2026-08-08" },
  { id: 103, name: "Brown Sugar 2kg", category: "Pantry", sellingPrice: 320, buyingPrice: 250, stock: 8, branch: "Kilimani" },
  { id: 104, name: "Sunflower Oil 3L", category: "Pantry", sellingPrice: 780, buyingPrice: 610, stock: 26, branch: "Westlands" },
  { id: 105, name: "Wheat Flour 2kg", category: "Pantry", sellingPrice: 210, buyingPrice: 165, stock: 64, branch: "Karen" },
  { id: 106, name: "Green Tea 100 bags", category: "Beverages", sellingPrice: 540, buyingPrice: 410, stock: 31, branch: "CBD" },
  { id: 107, name: "Cheddar Block 400g", category: "Dairy", sellingPrice: 690, buyingPrice: 520, stock: 3, branch: "Kilimani", expiryDate: "2026-08-10" },
  { id: 108, name: "Bar Soap 6pk", category: "Household", sellingPrice: 450, buyingPrice: 340, stock: 77, branch: "Westlands" },
  { id: 109, name: "Rice Pishori 5kg", category: "Pantry", sellingPrice: 1290, buyingPrice: 990, stock: 19, branch: "Karen" },
  { id: 110, name: "Yoghurt 250ml", category: "Dairy", sellingPrice: 90, buyingPrice: 62, stock: 48, branch: "CBD", expiryDate: "2026-08-12" },
];

export type ExpiringProduct = { id: number; name: string; branch: string; stock: number; expiryDate: string };

export const expiringProducts: ExpiringProduct[] = [
  { id: 102, name: "Fresh Milk 500ml", branch: "CBD", stock: 180, expiryDate: "2026-08-08" },
  { id: 107, name: "Cheddar Block 400g", branch: "Kilimani", stock: 3, expiryDate: "2026-08-10" },
  { id: 110, name: "Yoghurt 250ml", branch: "CBD", stock: 48, expiryDate: "2026-08-12" },
  { id: 101, name: "Arabica Beans 1kg", branch: "Westlands", stock: 42, expiryDate: "2026-08-14" },
];

export type SmsLog = { id: number; recipient: string; message: string; status: "sent" | "failed" | "queued"; sentAt: string };

export const smsLogs: SmsLog[] = [
  { id: 1, recipient: "0722 445 981", message: "Products about to expire: Fresh Milk 500ml - 2026-08-08", status: "sent", sentAt: "05 Aug, 07:00" },
  { id: 2, recipient: "0722 445 981", message: "Products about to expire: Cheddar Block 400g - 2026-08-10", status: "sent", sentAt: "05 Aug, 07:00" },
  { id: 3, recipient: "0733 210 442", message: "Low stock alert: Brown Sugar 2kg (8 left)", status: "queued", sentAt: "05 Aug, 08:15" },
  { id: 4, recipient: "0700 998 112", message: "Reorder reminder sent for Kilimani branch", status: "failed", sentAt: "04 Aug, 18:30" },
];

export type ShopDebtorNotif = { id: number; name: string; branch: string; dueDate: string; balance: number };
export type CustomerDebtorNotif = { id: number; name: string; dueDate: string; balance: number };
export type LowStockNotif = { id: number; name: string; branch: string; stock: number; price: number };

export const shopDebtorNotifs: ShopDebtorNotif[] = [
  { id: 1, name: "John Kamau", branch: "Westlands", dueDate: "2026-07-28", balance: 4200 },
  { id: 2, name: "Faith Njeri", branch: "CBD", dueDate: "2026-08-01", balance: 1800 },
];

export const customerDebtorNotifs: CustomerDebtorNotif[] = [
  { id: 1, name: "Riverside Cafe", dueDate: "2026-07-25", balance: 26400 },
];

export const lowStockNotifs: LowStockNotif[] = [
  { id: 107, name: "Cheddar Block 400g", branch: "Kilimani", stock: 3, price: 690 },
  { id: 103, name: "Brown Sugar 2kg", branch: "Kilimani", stock: 8, price: 320 },
];

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

export const pendingOrders: PendingOrder[] = [
  { id: 1, reference: "ORD-88213", customer: "Mercy Wanjiru", phone: "0712 334 556", branch: "Westlands", amount: 3200, paymentMethod: "M-Pesa", itemsCount: 4, createdAt: "2026-08-05 09:14" },
  { id: 2, reference: "ORD-88214", customer: "Dennis Otieno", phone: "0798 221 004", branch: "CBD", amount: 1150, paymentMethod: "Cash on delivery", itemsCount: 2, createdAt: "2026-08-05 10:02" },
  { id: 3, reference: "ORD-88215", customer: "Aisha Noor", phone: "0733 890 221", branch: "Karen", amount: 8600, paymentMethod: "M-Pesa", itemsCount: 7, createdAt: "2026-08-05 10:41" },
];