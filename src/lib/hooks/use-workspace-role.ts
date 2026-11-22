"use client";
import { useEffect, useState } from "react";

/** Workspace role for the current user, or null while loading/unavailable. */
export function useWorkspaceRole(enabled = true): string | null {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch("/api/auth/workspace")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: string } | null) => {
        if (active && data?.role) setRole(data.role);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);

  return role;
}

export function canManageWorkspace(role: string | null): boolean {
  return role === "admin" || role === "owner";
}
