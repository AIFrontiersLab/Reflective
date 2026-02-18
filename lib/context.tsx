"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Identity, User } from "./types";
import * as tauri from "./tauri";

interface AppState {
  user: User | null;
  identities: Identity[];
  currentIdentity: Identity | null;
  loading: boolean;
  error: string | null;
  setCurrentIdentity: (id: Identity | null) => void;
  refreshUser: () => Promise<void>;
  refreshIdentities: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [currentIdentity, setCurrentIdentityState] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const u = await tauri.getUser();
      setUser(u);
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const refreshIdentities = useCallback(async () => {
    if (!user) return;
    try {
      const list = await tauri.listIdentities(user.id);
      setIdentities(list);
      setCurrentIdentityState((prev) => {
        if (!prev) return list[0] ?? null;
        const found = list.find((i) => i.id === prev.id);
        return found ?? list[0] ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const u = await tauri.getUser();
        if (cancelled) return;
        setUser(u);
        if (u) {
          const list = await tauri.listIdentities(u.id);
          if (cancelled) return;
          setIdentities(list);
          setCurrentIdentityState(list[0] ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user) refreshIdentities();
  }, [user, refreshIdentities]);

  const setCurrentIdentity = useCallback((id: Identity | null) => {
    setCurrentIdentityState(id);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        identities,
        currentIdentity,
        loading,
        error,
        setCurrentIdentity,
        refreshUser,
        refreshIdentities,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
