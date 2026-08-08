import "server-only";

import { getLowStockProducts, getInventorySummary } from "./catalog";
import { getCustomerCount } from "./customers";
import { getRecentSales, getRevenueSeries, getSalesTotals } from "./sales";

/**
 * One round of queries for the operations overview. Grouped here so the page
 * component stays declarative and the queries run concurrently.
 */
export async function getDashboard() {
  const [totals, series, lowStock, inventory, customers, recent] = await Promise.all([
    getSalesTotals(),
    getRevenueSeries(7),
    getLowStockProducts(),
    getInventorySummary(),
    getCustomerCount(),
    getRecentSales(5),
  ]);

  return { totals, series, lowStock, inventory, customers, recent };
}
