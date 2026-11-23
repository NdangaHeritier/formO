"use client";
import { createContext, useContext } from "react";
import type { HeaderAudience } from "./config";

export type AudienceContextValue = {
  audience: HeaderAudience;
  canManage: boolean;
};

export const AudienceContext = createContext<AudienceContextValue>({
  audience: "public",
  canManage: false,
});

export function AudienceProvider({
  audience,
  canManage,
  children,
}: AudienceContextValue & { children: React.ReactNode }) {
  return (
    <AudienceContext.Provider value={{ audience, canManage }}>
      {children}
    </AudienceContext.Provider>
  );
}

export function useAudience(): AudienceContextValue {
  return useContext(AudienceContext);
}
