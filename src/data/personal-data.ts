export type PortfolioHolding = {
  id: string;
  symbol: string;
  shares: number;
  averageCost: number;
};

export type InvestmentMemory = {
  whyWatching: string;
  buyThesis: string;
  risks: string;
  exitConditions: string;
  personalNotes: string;
};

export type InvestmentNote = {
  id: string;
  date: string;
  symbol: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PersonalData = {
  version: 1;
  portfolio: PortfolioHolding[];
  investmentMemory: Record<string, InvestmentMemory>;
  investmentNotes: InvestmentNote[];
};

export const emptyInvestmentMemory: InvestmentMemory = {
  whyWatching: "",
  buyThesis: "",
  risks: "",
  exitConditions: "",
  personalNotes: "",
};

export function emptyPersonalData(): PersonalData {
  return { version: 1, portfolio: [], investmentMemory: {}, investmentNotes: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSymbol(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z][A-Z0-9.-]{0,9}$/.test(value);
}

function isHolding(value: unknown): value is PortfolioHolding {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.length > 0 && isSymbol(value.symbol) &&
    typeof value.shares === "number" && Number.isFinite(value.shares) && value.shares > 0 &&
    typeof value.averageCost === "number" && Number.isFinite(value.averageCost) && value.averageCost > 0;
}

function isNote(value: unknown): value is InvestmentNote {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.length > 0 &&
    typeof value.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    (value.symbol === "" || isSymbol(value.symbol)) &&
    typeof value.title === "string" && value.title.trim().length > 0 &&
    typeof value.content === "string" && value.content.trim().length > 0 &&
    typeof value.createdAt === "string" && typeof value.updatedAt === "string";
}

function normalizeMemory(value: unknown): InvestmentMemory | null {
  if (!isRecord(value)) return null;
  const fields = ["whyWatching", "buyThesis", "risks", "exitConditions", "personalNotes"] as const;
  if (fields.some((field) => typeof value[field] !== "string")) return null;
  return {
    whyWatching: value.whyWatching as string,
    buyThesis: value.buyThesis as string,
    risks: value.risks as string,
    exitConditions: value.exitConditions as string,
    personalNotes: value.personalNotes as string,
  };
}

export function normalizePersonalData(value: unknown): PersonalData {
  if (!isRecord(value) || value.version !== 1) return emptyPersonalData();

  const portfolio = Array.isArray(value.portfolio) ? value.portfolio.filter(isHolding) : [];
  const investmentNotes = Array.isArray(value.investmentNotes) ? value.investmentNotes.filter(isNote) : [];
  const investmentMemory: Record<string, InvestmentMemory> = {};

  if (isRecord(value.investmentMemory)) {
    for (const [symbol, memory] of Object.entries(value.investmentMemory)) {
      const normalized = normalizeMemory(memory);
      if (isSymbol(symbol) && normalized) investmentMemory[symbol] = normalized;
    }
  }

  return { version: 1, portfolio, investmentMemory, investmentNotes };
}
