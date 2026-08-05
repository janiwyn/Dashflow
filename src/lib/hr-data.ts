export const branches = [
  { id: 1, name: "Nairobi CBD" },
  { id: 2, name: "Westlands" },
  { id: 3, name: "Karen" },
  { id: 4, name: "Mombasa Rd" },
];

export const systemUsers = [
  { id: 101, username: "jkamau" },
  { id: 102, username: "amwangi" },
  { id: 103, username: "gotieno" },
  { id: 104, username: "hyusuf" },
];

export type Employee = {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string;
  branch: string;
  position: string;
  baseSalary: number;
  hireDate: string;
  status: "Active" | "Inactive";
};

export const employees: Employee[] = [
  { id: 1, userId: 101, name: "James Kamau", email: "jkamau@meridianpos.co.ke", phone: "0712 334 551", branch: "Nairobi CBD", position: "Branch Manager", baseSalary: 85000, hireDate: "2022-03-14", status: "Active" },
  { id: 2, userId: 102, name: "Alice Mwangi", email: "amwangi@meridianpos.co.ke", phone: "0722 118 902", branch: "Westlands", position: "Cashier", baseSalary: 38000, hireDate: "2023-06-01", status: "Active" },
  { id: 3, userId: 103, name: "Grace Otieno", email: "gotieno@meridianpos.co.ke", phone: "0733 445 210", branch: "Karen", position: "Sales Associate", baseSalary: 42000, hireDate: "2021-11-20", status: "Active" },
  { id: 4, userId: 104, name: "Halima Yusuf", email: "hyusuf@meridianpos.co.ke", phone: "0700 992 341", branch: "Mombasa Rd", position: "Stock Controller", baseSalary: 48000, hireDate: "2020-08-05", status: "Inactive" },
  { id: 5, userId: null, name: "Peter Njoroge", email: "peter.njoroge@gmail.com", phone: "0711 776 654", branch: "Nairobi CBD", position: "Cleaner", baseSalary: 22000, hireDate: "2024-01-10", status: "Active" },
];

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

function calc(base: number, transport: number, housing: number, medical: number, overtime: number, nssf: number, tax: number, loan: number, other: number) {
  const gross = base + transport + housing + medical + overtime;
  const deductions = nssf + tax + loan + other;
  return { gross, net: gross - deductions };
}

export const payrollRecords: PayrollRecord[] = [
  (() => {
    const c = calc(85000, 8000, 15000, 4000, 2000, 5000, 12500, 0, 0);
    return { id: 1, employeeId: 1, employee: "James Kamau", baseSalary: 85000, transport: 8000, housing: 15000, medical: 4000, overtime: 2000, nssf: 5000, tax: 12500, loan: 0, otherDeductions: 0, ...c, month: "2026-05", status: "Paid" as const };
  })(),
  (() => {
    const c = calc(38000, 3000, 5000, 1500, 1200, 2160, 4300, 2000, 500);
    return { id: 2, employeeId: 2, employee: "Alice Mwangi", baseSalary: 38000, transport: 3000, housing: 5000, medical: 1500, overtime: 1200, nssf: 2160, tax: 4300, loan: 2000, otherDeductions: 500, ...c, month: "2026-05", status: "Paid" as const };
  })(),
  (() => {
    const c = calc(42000, 3000, 6000, 1500, 800, 2160, 4900, 0, 0);
    return { id: 3, employeeId: 3, employee: "Grace Otieno", baseSalary: 42000, transport: 3000, housing: 6000, medical: 1500, overtime: 800, nssf: 2160, tax: 4900, loan: 0, otherDeductions: 0, ...c, month: "2026-06", status: "Pending" as const };
  })(),
  (() => {
    const c = calc(48000, 3500, 6500, 1800, 0, 2160, 5700, 1500, 0);
    return { id: 4, employeeId: 4, employee: "Halima Yusuf", baseSalary: 48000, transport: 3500, housing: 6500, medical: 1800, overtime: 0, nssf: 2160, tax: 5700, loan: 1500, otherDeductions: 0, ...c, month: "2026-06", status: "Pending" as const };
  })(),
];

export type SystemUserAccount = {
  id: number;
  username: string;
  role: "admin" | "manager" | "staff" | "super";
  branch: string | null;
  createdAt: string;
  status: "Active" | "Suspended";
};

export const userAccounts: SystemUserAccount[] = [
  { id: 1, username: "jkamau", role: "manager", branch: "Nairobi CBD", createdAt: "2022-03-14", status: "Active" },
  { id: 2, username: "amwangi", role: "staff", branch: "Westlands", createdAt: "2023-06-01", status: "Active" },
  { id: 3, username: "gotieno", role: "staff", branch: "Karen", createdAt: "2021-11-20", status: "Active" },
  { id: 4, username: "hyusuf", role: "staff", branch: "Mombasa Rd", createdAt: "2020-08-05", status: "Suspended" },
  { id: 5, username: "admin", role: "admin", branch: null, createdAt: "2020-01-01", status: "Active" },
];

export const currentProfile = {
  id: 1,
  username: "James Kamau",
  email: "jkamau@meridianpos.co.ke",
  phone: "0712 334 551",
  role: "Branch Manager",
  branch: "Nairobi CBD",
};