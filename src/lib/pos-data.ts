export const currency = (n: number) =>
  "KSh " + n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const products = [
  { id: "P-1041", name: "Arabica Beans 1kg", category: "Beverages", price: 1850, stock: 42 },
  { id: "P-1042", name: "Fresh Milk 500ml", category: "Dairy", price: 65, stock: 180 },
  { id: "P-1043", name: "Brown Sugar 2kg", category: "Pantry", price: 320, stock: 8 },
  { id: "P-1044", name: "Sunflower Oil 3L", category: "Pantry", price: 780, stock: 26 },
  { id: "P-1045", name: "Wheat Flour 2kg", category: "Pantry", price: 210, stock: 64 },
  { id: "P-1046", name: "Green Tea 100 bags", category: "Beverages", price: 540, stock: 31 },
  { id: "P-1047", name: "Cheddar Block 400g", category: "Dairy", price: 690, stock: 3 },
  { id: "P-1048", name: "Bar Soap 6pk", category: "Household", price: 450, stock: 77 },
  { id: "P-1049", name: "Rice Pishori 5kg", category: "Pantry", price: 1290, stock: 19 },
  { id: "P-1050", name: "Cooking Salt 1kg", category: "Pantry", price: 55, stock: 210 },
  { id: "P-1051", name: "Detergent 2L", category: "Household", price: 620, stock: 12 },
  { id: "P-1052", name: "Yoghurt 250ml", category: "Dairy", price: 90, stock: 48 },
];

export const categories = ["All", "Beverages", "Dairy", "Pantry", "Household"];

export const sales = [
  { id: "RCP-20841", customer: "Walk-in", items: 6, amount: 4380, method: "M-Pesa", status: "Paid", time: "12:41" },
  { id: "RCP-20840", customer: "Halima Yusuf", items: 2, amount: 910, method: "Cash", status: "Paid", time: "12:22" },
  { id: "RCP-20839", customer: "Riverside Cafe", items: 18, amount: 26400, method: "Invoice", status: "Pending", time: "11:58" },
  { id: "RCP-20838", customer: "Walk-in", items: 1, amount: 320, method: "Cash", status: "Paid", time: "11:31" },
  { id: "RCP-20837", customer: "Peter Mwangi", items: 9, amount: 7150, method: "Card", status: "Paid", time: "10:47" },
  { id: "RCP-20836", customer: "Walk-in", items: 3, amount: 1240, method: "M-Pesa", status: "Refunded", time: "10:12" },
  { id: "RCP-20835", customer: "Grace Otieno", items: 5, amount: 2870, method: "M-Pesa", status: "Paid", time: "09:54" },
];

export const revenueSeries = [
  { day: "Mon", revenue: 128000, orders: 142 },
  { day: "Tue", revenue: 154000, orders: 168 },
  { day: "Wed", revenue: 141000, orders: 151 },
  { day: "Thu", revenue: 187000, orders: 194 },
  { day: "Fri", revenue: 232000, orders: 241 },
  { day: "Sat", revenue: 268000, orders: 288 },
  { day: "Sun", revenue: 196000, orders: 203 },
];

export const customers = [
  { name: "Riverside Cafe", type: "Wholesale", orders: 84, spend: 1284000, balance: 26400 },
  { name: "Peter Mwangi", type: "Retail", orders: 41, spend: 168400, balance: 0 },
  { name: "Grace Otieno", type: "Retail", orders: 33, spend: 92300, balance: 0 },
  { name: "Halima Yusuf", type: "Retail", orders: 27, spend: 71800, balance: 1200 },
  { name: "Nyali Hotel", type: "Wholesale", orders: 19, spend: 940500, balance: 118000 },
];

export const suppliers = [
  { name: "Highland Coffee Ltd", category: "Beverages", lastDelivery: "2 days ago", payable: 184000 },
  { name: "Rift Valley Dairy", category: "Dairy", lastDelivery: "Today", payable: 42500 },
  { name: "Unga Millers", category: "Pantry", lastDelivery: "5 days ago", payable: 0 },
  { name: "CleanCo Supplies", category: "Household", lastDelivery: "1 week ago", payable: 31200 },
];

export const expenses = [
  { ref: "EXP-3391", label: "Branch rent — June", category: "Rent", amount: 145000, date: "01 Jun" },
  { ref: "EXP-3392", label: "Electricity (KPLC)", category: "Utilities", amount: 23400, date: "04 Jun" },
  { ref: "EXP-3393", label: "Delivery fuel", category: "Logistics", amount: 18700, date: "07 Jun" },
  { ref: "EXP-3394", label: "Casual staff wages", category: "Payroll", amount: 64000, date: "09 Jun" },
];

export const branches = [
  { name: "Nairobi — Main", manager: "James Kariuki", staff: 14, today: 268400, status: "Open" },
  { name: "Mombasa — Nyali", manager: "Aisha Said", staff: 9, today: 141200, status: "Open" },
  { name: "Kisumu — Oginga", manager: "Brian Ochieng", staff: 7, today: 88600, status: "Open" },
  { name: "Nakuru — CBD", manager: "Lucy Wanjiru", staff: 6, today: 0, status: "Closed" },
];