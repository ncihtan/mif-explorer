import React, { createContext, useContext, useState, useCallback } from 'react';
import { FilterState } from '../types';

const initialFilters: FilterState = {
  searchQuery: '',
  diagnoses: [],
  centers: [],
  assayTypes: [],
  antibodies: [],
  categories: [],
  panelIds: [],
};

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleArrayFilter: (key: keyof Pick<FilterState, 'diagnoses' | 'centers' | 'antibodies' | 'categories' | 'panelIds'>, value: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const resetFilters = useCallback(() => setFilters(initialFilters), []);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayFilter = useCallback((key: keyof Pick<FilterState, 'diagnoses' | 'centers' | 'antibodies' | 'categories' | 'panelIds'>, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, toggleArrayFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within FilterProvider");
  return context;
}