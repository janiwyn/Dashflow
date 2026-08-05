export const currency = (n: number) =>
  "KSh " + n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

export const businesses: Business[] = [
  { id: 1, name: "Mama Njeri Supermarket", adminName: "Njeri Wambui", adminEmail: "njeri@mamanjeri.co.ke", phone: "0722 341 908", address: "Ngong Road, Nairobi", dateRegistered: "2025-01-14", status: "active", subscriptionStart: "2025-01-14", subscriptionEnd: "2026-01-14", subscriptionStatus: "active" },
  { id: 2, name: "Kilimani Fresh Mart", adminName: "David Kariuki", adminEmail: "david@kilimanifresh.co.ke", phone: "0733 214 771", address: "Kilimani, Nairobi", dateRegistered: "2025-02-02", status: "active", subscriptionStart: "2025-02-02", subscriptionEnd: "2025-08-02", subscriptionStatus: "expired" },
  { id: 3, name: "Eastleigh Traders Ltd", adminName: "Abdi Hassan", adminEmail: "abdi@eastleightraders.co.ke", phone: "0711 902 344", address: "Eastleigh, Nairobi", dateRegistered: "2025-03-18", status: "suspended", subscriptionStart: "2025-03-18", subscriptionEnd: "2025-09-18", subscriptionStatus: "pending" },
  { id: 4, name: "Westside Pharmacy", adminName: "Grace Mwikali", adminEmail: "grace@westsidepharm.co.ke", phone: "0700 556 812", address: "Westlands, Nairobi", dateRegistered: "2025-04-05", status: "active", subscriptionStart: "2025-04-05", subscriptionEnd: "2026-04-05", subscriptionStatus: "active" },
  { id: 5, name: "Thika Road Electronics", adminName: null, adminEmail: null, phone: "0745 981 200", address: "Thika Road, Nairobi", dateRegistered: "2025-05-27", status: "active", subscriptionStart: "2025-05-27", subscriptionEnd: "2025-11-27", subscriptionStatus: "pending" },
  { id: 6, name: "Rongai Hardware", adminName: "Samuel Otieno", adminEmail: "samuel@rongaihardware.co.ke", phone: "0721 443 908", address: "Rongai, Kajiado", dateRegistered: "2025-06-11", status: "suspended", subscriptionStart: "2025-06-11", subscriptionEnd: "2025-07-11", subscriptionStatus: "expired" },
  { id: 7, name: "Karen Boutique House", adminName: "Amina Farah", adminEmail: "amina@karenboutique.co.ke", phone: "0798 302 156", address: "Karen, Nairobi", dateRegistered: "2025-07-01", status: "active", subscriptionStart: "2025-07-01", subscriptionEnd: "2026-07-01", subscriptionStatus: "active" },
];

export type Admin = {
  id: number;
  username: string;
  email: string;
  businessName: string;
  role: "admin" | "manager";
  status: "active" | "inactive";
  createdAt: string;
};

export const admins: Admin[] = [
  { id: 1, username: "Njeri Wambui", email: "njeri@mamanjeri.co.ke", businessName: "Mama Njeri Supermarket", role: "admin", status: "active", createdAt: "2025-01-14" },
  { id: 2, username: "David Kariuki", email: "david@kilimanifresh.co.ke", businessName: "Kilimani Fresh Mart", role: "admin", status: "active", createdAt: "2025-02-02" },
  { id: 3, username: "Abdi Hassan", email: "abdi@eastleightraders.co.ke", businessName: "Eastleigh Traders Ltd", role: "admin", status: "inactive", createdAt: "2025-03-18" },
  { id: 4, username: "Grace Mwikali", email: "grace@westsidepharm.co.ke", businessName: "Westside Pharmacy", role: "admin", status: "active", createdAt: "2025-04-05" },
  { id: 5, username: "Samuel Otieno", email: "samuel@rongaihardware.co.ke", businessName: "Rongai Hardware", role: "admin", status: "inactive", createdAt: "2025-06-11" },
  { id: 6, username: "Amina Farah", email: "amina@karenboutique.co.ke", businessName: "Karen Boutique House", role: "admin", status: "active", createdAt: "2025-07-01" },
];

export const businessGrowth = [
  { month: "Feb 2025", total: 4 },
  { month: "Mar 2025", total: 7 },
  { month: "Apr 2025", total: 9 },
  { month: "May 2025", total: 13 },
  { month: "Jun 2025", total: 17 },
  { month: "Jul 2025", total: 22 },
  { month: "Aug 2025", total: 28 },
];

export const systemLogs: string[] = [
  "2025-07-31 08:12:03 - [Super Admin] Uploaded update file: pos-patch-2.3.1.zip",
  "2025-07-30 21:47:55 - [Super Admin] Created database backup: db_backup_2025_07_30_214755.sql",
  "2025-07-29 10:03:11 - [Super Admin] Cleared system logs",
  "2025-07-28 16:22:40 - [Super Admin] Cleared cache",
  "2025-07-26 09:14:02 - [Super Admin] Uploaded update file: inventory-module-1.0.4.sql",
  "2025-07-22 13:58:19 - [Super Admin] Created database backup: db_backup_2025_07_22_135819.sql",
];