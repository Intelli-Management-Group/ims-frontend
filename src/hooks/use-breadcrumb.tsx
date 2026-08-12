import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type BreadcrumbOverride = { label: string; path: string }[];

type BreadcrumbContextValue = {
  overrides: BreadcrumbOverride | null;
  setBreadcrumbs: (crumbs: BreadcrumbOverride | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  overrides: null,
  setBreadcrumbs: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<BreadcrumbOverride | null>(null);

  const setBreadcrumbs = useCallback((crumbs: BreadcrumbOverride | null) => {
    setOverrides(crumbs);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ overrides, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
