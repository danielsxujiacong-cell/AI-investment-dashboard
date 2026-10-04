"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  emptyPersonalData,
  normalizePersonalData,
  type InvestmentMemory,
  type InvestmentNote,
  type PersonalData,
  type PortfolioHolding,
} from "@/data/personal-data";
import { readStoredWatchlist, readWatchlist, saveWatchlist as saveLocalWatchlist, watchlistStorageKey } from "@/data/watchlist";
import { stockFromReference, type StockReference } from "@/data/stock-universe";
import type { Stock } from "@/data/stocks";
import { getSupabaseClient, supabaseConfigured } from "@/data/supabase-client";

const storageKey = "northstar-personal-data-v1";

type DashboardUser = { id: string; email: string | null };
type LocalSnapshot = {
  data: PersonalData;
  watchlist: Stock[];
  storedWatchlist: Stock[] | null;
  hasAnyData: boolean;
  storageAvailable: boolean;
};
type CloudSnapshot = { data: PersonalData; watchlist: Stock[]; empty: boolean };
type SyncState = "local" | "loading" | "cloud" | "error";
type CloudCollection = "portfolio" | "investmentMemory" | "investmentNotes" | "watchlist";

class CloudConflictError extends Error {
  constructor(readonly snapshot: CloudSnapshot) {
    super("A newer cloud change was found. It has been loaded and your change was not saved.");
  }
}

type PersonalDataContextValue = {
  data: PersonalData;
  watchlist: Stock[];
  ready: boolean;
  storageAvailable: boolean;
  user: DashboardUser | null;
  authReady: boolean;
  authConfigured: boolean;
  syncState: SyncState;
  syncing: boolean;
  syncError: string | null;
  syncNotice: string | null;
  authError: string | null;
  importAvailable: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  retryCloudLoad: () => Promise<void>;
  importLocalData: () => Promise<void>;
  savePortfolio: (holdings: PortfolioHolding[]) => Promise<boolean>;
  saveInvestmentMemory: (symbol: string, memory: InvestmentMemory) => Promise<boolean>;
  saveInvestmentNotes: (notes: InvestmentNote[]) => Promise<boolean>;
  saveWatchlist: (stocks: Stock[]) => Promise<boolean>;
};

const PersonalDataContext = createContext<PersonalDataContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readLocalSnapshot(): LocalSnapshot {
  let data = emptyPersonalData();
  let storageAvailable = true;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) data = normalizePersonalData(JSON.parse(raw) as unknown);
  } catch {
    storageAvailable = false;
  }

  const storedWatchlist = readStoredWatchlist();
  const watchlist = storedWatchlist ?? readWatchlist();
  const hasAnyData = data.portfolio.length > 0 || Object.keys(data.investmentMemory).length > 0 ||
    data.investmentNotes.length > 0 || Boolean(storedWatchlist?.length);
  return { data, watchlist, storedWatchlist, hasAnyData, storageAvailable };
}

function toDashboardUser(user: User | null): DashboardUser | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

function resultError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

async function readCloudSnapshot(userId: string): Promise<CloudSnapshot> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured for this build.");

  const [watchlistResult, portfolioResult, memoryResult, notesResult] = await Promise.all([
    client.from("investment_watchlist").select("symbol, company_name, market, exchange").eq("user_id", userId).order("updated_at", { ascending: false }),
    client.from("investment_portfolio").select("id, symbol, shares, average_cost").eq("user_id", userId).order("updated_at", { ascending: false }),
    client.from("investment_memories").select("symbol, why, buy_thesis, risks, exit_conditions, personal_notes").eq("user_id", userId).order("updated_at", { ascending: false }),
    client.from("investment_notes").select("id, symbol, title, content, note_date, created_at, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
  ]);
  resultError(watchlistResult.error);
  resultError(portfolioResult.error);
  resultError(memoryResult.error);
  resultError(notesResult.error);

  const watchlistRows = watchlistResult.data ?? [];
  const portfolioRows = portfolioResult.data ?? [];
  const memoryRows = memoryResult.data ?? [];
  const noteRows = notesResult.data ?? [];
  const investmentMemory: Record<string, InvestmentMemory> = {};

  for (const row of memoryRows) {
    if (typeof row.symbol !== "string") continue;
    investmentMemory[row.symbol] = {
      whyWatching: typeof row.why === "string" ? row.why : "",
      buyThesis: typeof row.buy_thesis === "string" ? row.buy_thesis : "",
      risks: typeof row.risks === "string" ? row.risks : "",
      exitConditions: typeof row.exit_conditions === "string" ? row.exit_conditions : "",
      personalNotes: typeof row.personal_notes === "string" ? row.personal_notes : "",
    };
  }

  const data = normalizePersonalData({
    version: 1,
    portfolio: portfolioRows.map((row) => ({
      id: String(row.id),
      symbol: row.symbol,
      shares: Number(row.shares),
      averageCost: Number(row.average_cost),
    })),
    investmentMemory,
    investmentNotes: noteRows.map((row) => ({
      id: String(row.id),
      symbol: typeof row.symbol === "string" ? row.symbol : "",
      date: String(row.note_date),
      title: row.title,
      content: row.content,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
  });
  const watchlist = watchlistRows.flatMap((row) => {
    if (typeof row.symbol !== "string") return [];
    const symbol = row.symbol.trim().toUpperCase();
    const reference: StockReference = {
      symbol,
      name: typeof row.company_name === "string" && row.company_name.trim() ? row.company_name : symbol,
      market: typeof row.market === "string" && row.market.trim() ? row.market : "stocks",
      exchange: typeof row.exchange === "string" ? row.exchange : null,
    };
    return [stockFromReference(reference)];
  });

  return {
    data,
    watchlist,
    empty: watchlistRows.length === 0 && portfolioRows.length === 0 && memoryRows.length === 0 && noteRows.length === 0,
  };
}

function sameCollection(collection: CloudCollection, current: PersonalData, currentWatchlist: Stock[], cloud: CloudSnapshot) {
  if (collection === "portfolio") {
    const key = (rows: PortfolioHolding[]) => JSON.stringify([...rows]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, symbol, shares, averageCost }) => ({ id, symbol, shares, averageCost })));
    return key(current.portfolio) === key(cloud.data.portfolio);
  }
  if (collection === "investmentMemory") {
    const key = (rows: Record<string, InvestmentMemory>) => JSON.stringify(Object.entries(rows)
      .sort(([a], [b]) => a.localeCompare(b)));
    return key(current.investmentMemory) === key(cloud.data.investmentMemory);
  }
  if (collection === "investmentNotes") {
    const key = (rows: InvestmentNote[]) => JSON.stringify([...rows]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, date, symbol, title, content, createdAt }) => ({ id, date, symbol, title, content, createdAt })));
    return key(current.investmentNotes) === key(cloud.data.investmentNotes);
  }
  const key = (rows: Stock[]) => JSON.stringify([...rows]
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map((row) => ({ symbol: row.symbol.toUpperCase(), name: row.name, market: row.market || "stocks", exchange: row.exchange ?? null })));
  return key(currentWatchlist) === key(cloud.watchlist);
}

async function assertCloudCollectionCurrent(userId: string, collection: CloudCollection, data: PersonalData, watchlist: Stock[]) {
  const latest = await readCloudSnapshot(userId);
  if (!sameCollection(collection, data, watchlist, latest)) throw new CloudConflictError(latest);
}

async function syncPortfolio(userId: string, before: PortfolioHolding[], after: PortfolioHolding[]) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured for this build.");
  const previous = new Map(before.map((row) => [row.id, row]));
  const next = new Map(after.map((row) => [row.id, row]));
  const removed = [...previous.keys()].filter((id) => !next.has(id));
  const inserted = after.filter((row) => !previous.has(row.id));
  const changed = after.filter((row) => {
    const old = previous.get(row.id);
    return old && (old.symbol !== row.symbol || old.shares !== row.shares || old.averageCost !== row.averageCost);
  });
  const operations = [];
  if (removed.length) operations.push(client.from("investment_portfolio").delete().eq("user_id", userId).in("id", removed));
  if (inserted.length) operations.push(client.from("investment_portfolio").insert(inserted.map((row) => ({
    id: row.id, user_id: userId, symbol: row.symbol, shares: row.shares, average_cost: row.averageCost,
  }))));
  for (const row of changed) {
    operations.push(client.from("investment_portfolio").update({
      symbol: row.symbol, shares: row.shares, average_cost: row.averageCost, updated_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("id", row.id));
  }
  const results = await Promise.all(operations);
  for (const result of results) resultError(result.error);
  return operations.length > 0;
}

async function syncInvestmentMemory(userId: string, before: Record<string, InvestmentMemory>, after: Record<string, InvestmentMemory>) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured for this build.");
  const removed = Object.keys(before).filter((symbol) => !after[symbol]);
  const inserted = Object.entries(after).filter(([symbol]) => !before[symbol]);
  const changed = Object.entries(after).filter(([symbol, memory]) => {
    const old = before[symbol];
    return old && Object.keys(memory).some((field) => memory[field as keyof InvestmentMemory] !== old[field as keyof InvestmentMemory]);
  });
  const operations = [];
  if (removed.length) operations.push(client.from("investment_memories").delete().eq("user_id", userId).in("symbol", removed));
  for (const [symbol, memory] of inserted) {
    operations.push(client.from("investment_memories").insert({
      user_id: userId, symbol, why: memory.whyWatching, buy_thesis: memory.buyThesis,
      risks: memory.risks, exit_conditions: memory.exitConditions, personal_notes: memory.personalNotes,
    }));
  }
  for (const [symbol, memory] of changed) {
    operations.push(client.from("investment_memories").update({
      why: memory.whyWatching, buy_thesis: memory.buyThesis, risks: memory.risks,
      exit_conditions: memory.exitConditions, personal_notes: memory.personalNotes, updated_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("symbol", symbol));
  }
  const results = await Promise.all(operations);
  for (const result of results) resultError(result.error);
  return operations.length > 0;
}

async function syncInvestmentNotes(userId: string, before: InvestmentNote[], after: InvestmentNote[]) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured for this build.");
  const previous = new Map(before.map((row) => [row.id, row]));
  const next = new Map(after.map((row) => [row.id, row]));
  const removed = [...previous.keys()].filter((id) => !next.has(id));
  const inserted = after.filter((row) => !previous.has(row.id));
  const changed = after.filter((row) => {
    const old = previous.get(row.id);
    return old && (old.date !== row.date || old.symbol !== row.symbol || old.title !== row.title || old.content !== row.content || old.updatedAt !== row.updatedAt);
  });
  const operations = [];
  if (removed.length) operations.push(client.from("investment_notes").delete().eq("user_id", userId).in("id", removed));
  if (inserted.length) operations.push(client.from("investment_notes").insert(inserted.map((row) => ({
    id: row.id, user_id: userId, symbol: row.symbol || null, title: row.title, content: row.content,
    note_date: row.date, created_at: row.createdAt, updated_at: row.updatedAt,
  }))));
  for (const row of changed) {
    operations.push(client.from("investment_notes").update({
      symbol: row.symbol || null, title: row.title, content: row.content, note_date: row.date,
      updated_at: row.updatedAt,
    }).eq("user_id", userId).eq("id", row.id));
  }
  const results = await Promise.all(operations);
  for (const result of results) resultError(result.error);
  return operations.length > 0;
}

async function syncWatchlist(userId: string, before: Stock[], after: Stock[]) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured for this build.");
  const previous = new Map(before.map((stock) => [stock.symbol.toUpperCase(), stock]));
  const next = new Map(after.map((stock) => [stock.symbol.toUpperCase(), stock]));
  const removed = [...previous.keys()].filter((symbol) => !next.has(symbol));
  const inserted = after.filter((stock) => !previous.has(stock.symbol.toUpperCase()));
  const changed = after.filter((stock) => {
    const old = previous.get(stock.symbol.toUpperCase());
    return old && (old.name !== stock.name || old.exchange !== stock.exchange || old.market !== stock.market);
  });
  const operations = [];
  if (removed.length) operations.push(client.from("investment_watchlist").delete().eq("user_id", userId).in("symbol", removed));
  if (inserted.length) operations.push(client.from("investment_watchlist").insert(inserted.map((stock) => ({
    user_id: userId, symbol: stock.symbol.toUpperCase(), company_name: stock.name,
    market: stock.market || "stocks", exchange: stock.exchange ?? null,
  }))));
  for (const stock of changed) {
    operations.push(client.from("investment_watchlist").update({
      company_name: stock.name, market: stock.market || "stocks", exchange: stock.exchange ?? null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("symbol", stock.symbol.toUpperCase()));
  }
  const results = await Promise.all(operations);
  for (const result of results) resultError(result.error);
  return operations.length > 0;
}

function importPayload(snapshot: LocalSnapshot) {
  return {
    watchlist: (snapshot.storedWatchlist ?? []).map((stock) => ({
      symbol: stock.symbol, company_name: stock.name, market: stock.market || "stocks", exchange: stock.exchange ?? null,
    })),
    portfolio: snapshot.data.portfolio.map((holding) => ({
      id: holding.id, symbol: holding.symbol, shares: holding.shares, average_cost: holding.averageCost,
    })),
    investment_memory: Object.entries(snapshot.data.investmentMemory).map(([symbol, memory]) => ({
      symbol, why: memory.whyWatching, buy_thesis: memory.buyThesis, risks: memory.risks,
      exit_conditions: memory.exitConditions, personal_notes: memory.personalNotes,
    })),
    investment_notes: snapshot.data.investmentNotes.map((note) => ({
      id: note.id, symbol: note.symbol || null, title: note.title, content: note.content,
      note_date: note.date, created_at: note.createdAt, updated_at: note.updatedAt,
    })),
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected Supabase error occurred.";
}

export function PersonalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PersonalData>(() => emptyPersonalData());
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [importAvailable, setImportAvailable] = useState(false);
  const dataRef = useRef(data);
  const watchlistRef = useRef(watchlist);
  const readyRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const localSnapshotRef = useRef<LocalSnapshot | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const sessionHandlerRef = useRef<(nextUser: User | null) => Promise<void>>(async () => {});
  const retryHandlerRef = useRef<() => Promise<void>>(async () => {});

  const acceptData = useCallback((next: PersonalData) => {
    dataRef.current = next;
    setData(next);
  }, []);
  const acceptWatchlist = useCallback((next: Stock[]) => {
    watchlistRef.current = next;
    setWatchlist(next);
  }, []);
  const acceptLocalSnapshot = useCallback((snapshot: LocalSnapshot) => {
    localSnapshotRef.current = snapshot;
    acceptData(snapshot.data);
    acceptWatchlist(snapshot.watchlist);
    readyRef.current = true;
    setReady(true);
    setStorageAvailable(snapshot.storageAvailable);
    setSyncState("local");
    setImportAvailable(false);
  }, [acceptData, acceptWatchlist]);

  useEffect(() => {
    let active = true;
    let initializing = true;
    let queuedInitialUser: User | null | undefined;
    let unsubscribe: (() => void) | null = null;

    async function handleSession(nextUser: User | null) {
      if (!active) return;
      const nextId = nextUser?.id ?? null;
      if (userIdRef.current === nextId && readyRef.current) {
        setAuthReady(true);
        return;
      }
      const generation = ++generationRef.current;
      userIdRef.current = nextId;
      setUser(toDashboardUser(nextUser));
      setAuthReady(true);
      setAuthError(null);
      setSyncError(null);
      setSyncNotice(null);
      setImportAvailable(false);

      if (!nextUser) {
        acceptLocalSnapshot(readLocalSnapshot());
        return;
      }

      readyRef.current = false;
      setReady(false);
      acceptData(emptyPersonalData());
      acceptWatchlist([]);
      setSyncState("loading");
      try {
        const snapshot = await readCloudSnapshot(nextUser.id);
        if (!active || generation !== generationRef.current || userIdRef.current !== nextUser.id) return;
        acceptData(snapshot.data);
        acceptWatchlist(snapshot.watchlist);
        readyRef.current = true;
        setReady(true);
        setSyncState("cloud");
        const local = localSnapshotRef.current ?? readLocalSnapshot();
        localSnapshotRef.current = local;
        setImportAvailable(snapshot.empty && local.hasAnyData);
      } catch (error) {
        if (!active || generation !== generationRef.current) return;
        setSyncState("error");
        setSyncError("Could not load your Supabase data: " + errorMessage(error));
      }
    }

    sessionHandlerRef.current = handleSession;
    retryHandlerRef.current = async () => {
      const client = getSupabaseClient();
      const currentUser = userIdRef.current;
      if (!client || !currentUser) return;
      const generation = generationRef.current;
      readyRef.current = false;
      setReady(false);
      setSyncState("loading");
      setSyncError(null);
      try {
        const snapshot = await readCloudSnapshot(currentUser);
        if (!active || generation !== generationRef.current || userIdRef.current !== currentUser) return;
        acceptData(snapshot.data);
        acceptWatchlist(snapshot.watchlist);
        readyRef.current = true;
        setReady(true);
        setSyncState("cloud");
        const local = localSnapshotRef.current ?? readLocalSnapshot();
        localSnapshotRef.current = local;
        setImportAvailable(snapshot.empty && local.hasAnyData);
      } catch (error) {
        if (!active || generation !== generationRef.current) return;
        setSyncState("error");
        setSyncError("Could not load your Supabase data: " + errorMessage(error));
      }
    };

    const local = readLocalSnapshot();
    localSnapshotRef.current = local;
    setStorageAvailable(local.storageAvailable);
    const client = getSupabaseClient();
    if (!client) {
      acceptLocalSnapshot(local);
      setAuthReady(true);
      return () => { active = false; };
    }

    const subscription = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (initializing) {
        queuedInitialUser = nextUser;
        return;
      }
      queueMicrotask(() => void handleSession(nextUser));
    });
    unsubscribe = () => subscription.data.subscription.unsubscribe();

    void client.auth.getSession().then(async ({ data: result, error }) => {
      if (!active) return;
      initializing = false;
      if (error) {
        await handleSession(null);
        setAuthError("Could not restore the saved sign-in session: " + error.message);
        return;
      }
      await handleSession(queuedInitialUser === undefined ? result.session?.user ?? null : queuedInitialUser);
    }).catch(async (error: unknown) => {
      if (!active) return;
      initializing = false;
      await handleSession(null);
      setAuthError("Could not restore the saved sign-in session: " + errorMessage(error));
    });

    return () => {
      active = false;
      unsubscribe?.();
      sessionHandlerRef.current = async () => {};
      retryHandlerRef.current = async () => {};
    };
  }, [acceptData, acceptLocalSnapshot, acceptWatchlist]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (userIdRef.current !== null || (event.key !== storageKey && event.key !== watchlistStorageKey && event.key !== null)) return;
      acceptLocalSnapshot(readLocalSnapshot());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [acceptLocalSnapshot]);

  const enqueueCloudWrite = useCallback((ownerId: string, operation: () => Promise<void>): Promise<boolean> => {
    const generation = generationRef.current;
    const run = writeQueueRef.current.then(async () => {
      if (userIdRef.current !== ownerId || generation !== generationRef.current) return false;
      setSyncing(true);
      setSyncError(null);
      setSyncNotice(null);
      try {
        await operation();
        if (userIdRef.current !== ownerId || generation !== generationRef.current) return false;
        setSyncState("cloud");
        return true;
      } catch (error) {
        if (userIdRef.current === ownerId && generation === generationRef.current) {
          if (error instanceof CloudConflictError) {
            acceptData(error.snapshot.data);
            acceptWatchlist(error.snapshot.watchlist);
            readyRef.current = true;
            setReady(true);
            setSyncState("cloud");
            setSyncNotice(error.message + " Review the latest version before trying again.");
            const local = localSnapshotRef.current ?? readLocalSnapshot();
            setImportAvailable(error.snapshot.empty && local.hasAnyData);
          } else {
            readyRef.current = false;
            setReady(false);
            setSyncState("error");
            setSyncError("Supabase did not save this change: " + errorMessage(error) + " Refresh cloud data before trying again.");
          }
        }
        return false;
      } finally {
        if (userIdRef.current === ownerId && generation === generationRef.current) setSyncing(false);
      }
    });
    writeQueueRef.current = run.then(() => {});
    return run;
  }, []);

  const savePortfolio = useCallback((holdings: PortfolioHolding[]) => {
    if (!readyRef.current) return Promise.resolve(false);
    const ownerId = userIdRef.current;
    if (!ownerId) {
      const next = { ...dataRef.current, portfolio: holdings };
      acceptData(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
      localSnapshotRef.current = { ...(localSnapshotRef.current ?? readLocalSnapshot()), data: next,
        hasAnyData: holdings.length > 0 || Object.keys(next.investmentMemory).length > 0 || next.investmentNotes.length > 0 || Boolean(readStoredWatchlist()?.length) };
      return Promise.resolve(true);
    }
    return enqueueCloudWrite(ownerId, async () => {
      await assertCloudCollectionCurrent(ownerId, "portfolio", dataRef.current, watchlistRef.current);
      const before = dataRef.current.portfolio;
      if (await syncPortfolio(ownerId, before, holdings)) setImportAvailable(false);
      if (userIdRef.current === ownerId) acceptData({ ...dataRef.current, portfolio: holdings });
    });
  }, [acceptData, enqueueCloudWrite]);

  const saveInvestmentMemory = useCallback((symbol: string, memory: InvestmentMemory) => {
    if (!readyRef.current) return Promise.resolve(false);
    const current = dataRef.current.investmentMemory;
    const next = { ...current };
    if (Object.values(memory).every((value) => value.trim().length === 0)) delete next[symbol];
    else next[symbol] = memory;
    const ownerId = userIdRef.current;
    if (!ownerId) {
      const nextData = { ...dataRef.current, investmentMemory: next };
      acceptData(nextData);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextData));
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
      localSnapshotRef.current = { ...(localSnapshotRef.current ?? readLocalSnapshot()), data: nextData,
        hasAnyData: nextData.portfolio.length > 0 || Object.keys(next).length > 0 || nextData.investmentNotes.length > 0 || Boolean(readStoredWatchlist()?.length) };
      return Promise.resolve(true);
    }
    return enqueueCloudWrite(ownerId, async () => {
      await assertCloudCollectionCurrent(ownerId, "investmentMemory", dataRef.current, watchlistRef.current);
      if (await syncInvestmentMemory(ownerId, dataRef.current.investmentMemory, next)) setImportAvailable(false);
      if (userIdRef.current === ownerId) acceptData({ ...dataRef.current, investmentMemory: next });
    });
  }, [acceptData, enqueueCloudWrite]);

  const saveInvestmentNotes = useCallback((notes: InvestmentNote[]) => {
    if (!readyRef.current) return Promise.resolve(false);
    const ownerId = userIdRef.current;
    if (!ownerId) {
      const next = { ...dataRef.current, investmentNotes: notes };
      acceptData(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
      localSnapshotRef.current = { ...(localSnapshotRef.current ?? readLocalSnapshot()), data: next,
        hasAnyData: next.portfolio.length > 0 || Object.keys(next.investmentMemory).length > 0 || notes.length > 0 || Boolean(readStoredWatchlist()?.length) };
      return Promise.resolve(true);
    }
    return enqueueCloudWrite(ownerId, async () => {
      await assertCloudCollectionCurrent(ownerId, "investmentNotes", dataRef.current, watchlistRef.current);
      if (await syncInvestmentNotes(ownerId, dataRef.current.investmentNotes, notes)) setImportAvailable(false);
      if (userIdRef.current === ownerId) acceptData({ ...dataRef.current, investmentNotes: notes });
    });
  }, [acceptData, enqueueCloudWrite]);

  const saveWatchlist = useCallback((stocks: Stock[]) => {
    if (!readyRef.current) return Promise.resolve(false);
    const deduplicated = [...new Map(stocks.map((stock) => [stock.symbol.toUpperCase(), stock])).values()];
    const ownerId = userIdRef.current;
    if (!ownerId) {
      const saved = saveLocalWatchlist(deduplicated);
      acceptWatchlist(saved);
      const snapshot = localSnapshotRef.current ?? readLocalSnapshot();
      localSnapshotRef.current = { ...snapshot, watchlist: saved, storedWatchlist: saved,
        hasAnyData: snapshot.data.portfolio.length > 0 || Object.keys(snapshot.data.investmentMemory).length > 0 || snapshot.data.investmentNotes.length > 0 || saved.length > 0 };
      return Promise.resolve(true);
    }
    return enqueueCloudWrite(ownerId, async () => {
      await assertCloudCollectionCurrent(ownerId, "watchlist", dataRef.current, watchlistRef.current);
      if (await syncWatchlist(ownerId, watchlistRef.current, deduplicated)) setImportAvailable(false);
      if (userIdRef.current === ownerId) acceptWatchlist(deduplicated);
    });
  }, [acceptWatchlist, enqueueCloudWrite]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) {
      setAuthError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a publishable or anon key to the build environment.");
      return false;
    }
    setAuthError(null);
    try {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setAuthError(error.message);
        return false;
      }
      return true;
    } catch (error) {
      setAuthError(errorMessage(error));
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return false;
    setAuthError(null);
    try {
      const { error } = await client.auth.signOut();
      if (error) {
        setAuthError(error.message);
        return false;
      }
      await sessionHandlerRef.current(null);
      return true;
    } catch (error) {
      setAuthError(errorMessage(error));
      return false;
    }
  }, []);

  const retryCloudLoad = useCallback(async () => retryHandlerRef.current(), []);

  const importLocalData = useCallback(async () => {
    const client = getSupabaseClient();
    const ownerId = userIdRef.current;
    if (!client || !ownerId || !importAvailable || syncing) return;
    const snapshot = localSnapshotRef.current ?? readLocalSnapshot();
    const generation = generationRef.current;
    readyRef.current = false;
    setReady(false);
    setSyncing(true);
    setSyncError(null);
    setSyncNotice(null);
    try {
      await writeQueueRef.current;
      if (userIdRef.current !== ownerId || generation !== generationRef.current) return;
      const { data: imported, error } = await client.rpc("investment_import_local_data", { p_payload: importPayload(snapshot) });
      resultError(error);
      if (!isRecord(imported) || imported.imported !== true) {
        await retryHandlerRef.current();
        setSyncNotice("Cloud data already exists. It was kept, and the local copy was not imported.");
        return;
      }
      const cloud = await readCloudSnapshot(ownerId);
      if (userIdRef.current !== ownerId || generation !== generationRef.current) return;
      acceptData(cloud.data);
      acceptWatchlist(cloud.watchlist);
      readyRef.current = true;
      setReady(true);
      setImportAvailable(false);
      setSyncState("cloud");
      setSyncNotice("Local Watchlist, Portfolio, Investment Memory, and Investment Notes were imported. Your local copy is still preserved.");
    } catch (error) {
      setSyncState("error");
      setSyncError("Local data was not confirmed as imported: " + errorMessage(error));
    } finally {
      setSyncing(false);
    }
  }, [acceptData, acceptWatchlist, importAvailable, syncing]);

  const value = useMemo(() => ({
    data, watchlist, ready, storageAvailable, user, authReady, authConfigured: supabaseConfigured,
    syncState, syncing, syncError, syncNotice, authError, importAvailable,
    signIn, signOut, retryCloudLoad, importLocalData,
    savePortfolio, saveInvestmentMemory, saveInvestmentNotes, saveWatchlist,
  }), [data, watchlist, ready, storageAvailable, user, authReady, syncState, syncing, syncError, syncNotice,
    authError, importAvailable, signIn, signOut, retryCloudLoad, importLocalData, savePortfolio,
    saveInvestmentMemory, saveInvestmentNotes, saveWatchlist]);

  return <PersonalDataContext.Provider value={value}>{children}</PersonalDataContext.Provider>;
}

export function usePersonalData() {
  const value = useContext(PersonalDataContext);
  if (!value) throw new Error("usePersonalData must be used within PersonalDataProvider.");
  return value;
}
