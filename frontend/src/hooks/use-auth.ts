"use client";

import { useContext } from "react";
import { AuthContext } from "@/providers/auth-provider";
import type { AuthContextValue } from "@/types/auth";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
