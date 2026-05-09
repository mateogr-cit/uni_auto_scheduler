'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DataSource = 'live' | 'dummy';

interface DataSourceContextType {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  toggleDataSource: () => void;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [dataSource, setDataSourceState] = useState<DataSource>('live');

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('dataSource') as DataSource;
    if (saved === 'live' || saved === 'dummy') {
      setDataSourceState(saved);
    }
  }, []);

  const setDataSource = (source: DataSource) => {
    setDataSourceState(source);
    localStorage.setItem('dataSource', source);
  };

  const toggleDataSource = () => {
    const newSource = dataSource === 'live' ? 'dummy' : 'live';
    setDataSource(newSource);
  };

  return (
    <DataSourceContext.Provider value={{ dataSource, setDataSource, toggleDataSource }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
}
