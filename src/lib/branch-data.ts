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

export const branchesData: Branch[] = [
  { id: 1, name: "Nairobi — Main", location: "Moi Avenue, Nairobi CBD", contact: "0712 345 001", manager: "James Kariuki", staff: 14, status: "Open", todaySales: 268400 },
  { id: 2, name: "Mombasa — Nyali", location: "Nyali Rd, Mombasa", contact: "0712 345 002", manager: "Aisha Said", staff: 9, status: "Open", todaySales: 141200 },
  { id: 3, name: "Kisumu — Oginga", location: "Oginga Odinga St, Kisumu", contact: "0712 345 003", manager: "Brian Ochieng", staff: 7, status: "Open", todaySales: 88600 },
  { id: 4, name: "Nakuru — CBD", location: "Kenyatta Ave, Nakuru", contact: "0712 345 004", manager: null, staff: 6, status: "Closed", todaySales: 0 },
];

export const branchStock: Record<number, { name: string; stockLeft: number }[]> = {
  1: [
    { name: "Arabica Beans 1kg", stockLeft: 42 },
    { name: "Fresh Milk 500ml", stockLeft: 180 },
    { name: "Brown Sugar 2kg", stockLeft: 8 },
  ],
  2: [
    { name: "Wheat Flour 2kg", stockLeft: 64 },
    { name: "Green Tea 100 bags", stockLeft: 31 },
  ],
  3: [
    { name: "Rice Pishori 5kg", stockLeft: 19 },
    { name: "Cooking Salt 1kg", stockLeft: 210 },
  ],
  4: [],
};

export const branchWorkers: Record<number, { id: number; name: string; role: string; phone: string }[]> = {
  1: [
    { id: 101, name: "Peter Mwangi", role: "staff", phone: "0700 111 222" },
    { id: 102, name: "Grace Otieno", role: "staff", phone: "0700 111 333" },
    { id: 103, name: "James Kariuki", role: "manager", phone: "0700 111 444" },
  ],
  2: [
    { id: 104, name: "Aisha Said", role: "manager", phone: "0700 111 555" },
    { id: 105, name: "Halima Yusuf", role: "staff", phone: "0700 111 666" },
  ],
  3: [{ id: 106, name: "Brian Ochieng", role: "manager", phone: "0700 111 777" }],
  4: [],
};

export const branchFinancials: Record<number, { totalSales: number; totalExpenses: number }> = {
  1: { totalSales: 5824000, totalExpenses: 2140000 },
  2: { totalSales: 3120000, totalExpenses: 1180000 },
  3: { totalSales: 1980000, totalExpenses: 760000 },
  4: { totalSales: 0, totalExpenses: 0 },
};