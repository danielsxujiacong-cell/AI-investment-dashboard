"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  emptyPersonalData,
  normalizePersonalData,
  type InvestmentMemory,
  type InvestmentNote,
  type PersonalData,
  type PortfolioHolding,
} from "@/data/personal-data";

const storageKey = "northstar-personal-data-v1";

type PersonalDataContextValue = {
  data: PersonalData;
  ready: boolean;
  storageAvailable: boolean;
  savePortfolio: (holdings: PortfolioHolding[]) => void;
  saveInvestmentMemory: (symbol: string, memory: InvestmentMemory) => void;
  saveInvestmentNotes: (notes: InvestmentNote[]) => void;
};

const PersonalDataContext = createContext<PersonalDataContextValue | null>(null);

export function PersonalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PersonalData>(() => emptyPersonalData());
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const dataRef = useRef(data);

  const accept = useCallback((next: PersonalData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const persist = useCallback((next: PersonalData) => {
    if (!ready) return;
    accept(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [accept, ready]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) accept(normalizePersonalData(JSON.parse(raw) as unknown));
    } catch {
      setStorageAvailable(false);
    } finally {
      setReady(true);
    }
  }, [accept]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== storageKey) return;
      try {
        accept(event.newValue ? normalizePersonalData(JSON.parse(event.newValue) as unknown) : emptyPersonalData());
      } catch {
        accept(emptyPersonalData());
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [accept]);

  const savePortfolio = useCallback((portfolio: PortfolioHolding[]) => {
    persist({ ...dataRef.current, portfolio });
  }, [persist]);

  const saveInvestmentMemory = useCallback((symbol: string, memory: InvestmentMemory) => {
    const investmentMemory = { ...dataRef.current.investmentMemory };
    if (Object.values(memory).every((value) => value.trim().length === 0)) {
      delete investmentMemory[symbol];
    } else {
      investmentMemory[symbol] = memory;
    }
    persist({
      ...dataRef.current,
      investmentMemory,
    });
  }, [persist]);

  const saveInvestmentNotes = useCallback((investmentNotes: InvestmentNote[]) => {
    persist({ ...dataRef.current, investmentNotes });
  }, [persist]);

  const value = useMemo(() => ({
    data,
    ready,
    storageAvailable,
    savePortfolio,
    saveInvestmentMemory,
    saveInvestmentNotes,
  }), [data, ready, storageAvailable, savePortfolio, saveInvestmentMemory, saveInvestmentNotes]);

  return <PersonalDataContext.Provider value={value}>{children}</PersonalDataContext.Provider>;
}

export function usePersonalData() {
  const value = useContext(PersonalDataContext);
  if (!value) throw new Error("usePersonalData must be used within PersonalDataProvider.");
  return value;
}
