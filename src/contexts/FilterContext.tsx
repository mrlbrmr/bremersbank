import { createContext, useContext, useState, ReactNode } from "react";

export type PeriodFilter = "1m" | "3m" | "6m" | "1y";
export type ReportSection = "overview" | "balance" | "categories" | "income-vs-expense" | "comparison" | "insights";

export interface ReportFilters {
  period: PeriodFilter;
  showRealized: boolean;
  type?: "income" | "expense";
  category?: string;
  section?: ReportSection;
}

interface FilterContextType {
  filters: ReportFilters;
  setFilters: (f: ReportFilters) => void;
  updateFilters: (partial: Partial<ReportFilters>) => void;
  navigateToReport: (section: ReportSection, overrides?: Partial<ReportFilters>) => void;
  onNavigate?: (tab: string) => void;
}

const defaultFilters: ReportFilters = {
  period: "1m",
  showRealized: true,
  section: "overview",
};

const FilterContext = createContext<FilterContextType>({
  filters: defaultFilters,
  setFilters: () => {},
  updateFilters: () => {},
  navigateToReport: () => {},
});

export const useFilters = () => useContext(FilterContext);

export const FilterProvider = ({ children, onNavigate }: { children: ReactNode; onNavigate?: (tab: string) => void }) => {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);

  const updateFilters = (partial: Partial<ReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const navigateToReport = (section: ReportSection, overrides?: Partial<ReportFilters>) => {
    setFilters((prev) => ({ ...prev, section, ...overrides }));
    onNavigate?.("reports");
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilters, navigateToReport, onNavigate }}>
      {children}
    </FilterContext.Provider>
  );
};
