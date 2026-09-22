import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import type { Library, FileManifest, Panels } from '../types';

interface DataContextValue {
  library: Library;
  manifest: FileManifest;
  panels: Panels;
  isLoading: boolean;
  isError: boolean;
  filterOptions: ReturnType<typeof dataService.getFilterOptions>;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<{
    library: Library;
    manifest: FileManifest;
    panels: Panels;
  }>({ library: {}, manifest: [], panels: {} });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    dataService.initialize()
      .then(() => {
        setData({
          library: dataService.getLibrary(),
          manifest: dataService.getManifest(),
          panels: dataService.getPanels(),
        });
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsError(true);
        setIsLoading(false);
      });
  }, []);

  const filterOptions = !isLoading ? dataService.getFilterOptions() : {
    diagnoses: [], centers: [], assayTypes: [], antibodies: [], categories: []
  };

  return (
    <DataContext.Provider value={{ ...data, isLoading, isError, filterOptions }}>
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
