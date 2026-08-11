"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { ModuleKey } from "@/lib/modules";

const ModulesContext = createContext<ModuleKey[] | null>(null);

/**
 * Publishes the signed-in business's active module subscriptions to the
 * client tree. The super admin isn't tied to a single tenant, so the layout
 * passes every module key for that role — they operate the platform, not a
 * subscription.
 */
export function ModulesProvider({
  activeModules,
  children,
}: {
  activeModules: ModuleKey[];
  children: ReactNode;
}) {
  return <ModulesContext.Provider value={activeModules}>{children}</ModulesContext.Provider>;
}

export function useActiveModules(): Set<ModuleKey> {
  const modules = useContext(ModulesContext);
  return useMemo(() => new Set(modules ?? []), [modules]);
}

export function useHasModule(key: ModuleKey): boolean {
  return useActiveModules().has(key);
}
