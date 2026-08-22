/**
 * Shared with any "use server" action file that needs it (resetUserPassword,
 * createBusiness/createAdminForBusiness's auto-created admin logins). Kept
 * in its own plain module because a "use server" file may only export async
 * functions — a exported `const` there fails the whole module at build time.
 */
export const DEFAULT_PASSWORD = "12345678";
