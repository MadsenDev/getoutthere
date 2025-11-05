import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isInitialLoad: boolean;
  setInitialLoadComplete: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const setInitialLoadComplete = () => {
    setIsInitialLoad(false);
  };

  return (
    <LoadingContext.Provider value={{ isInitialLoad, setInitialLoadComplete }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

