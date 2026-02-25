import React, { createContext, useContext, ReactNode } from 'react';
import { useSubdomain, SubdomainCompany } from '@/hooks/useSubdomain';

interface SubdomainContextType {
  isSubdomain: boolean;
  isCustomDomain: boolean;
  subdomain: string | null;
  company: SubdomainCompany | null;
  loading: boolean;
  error: string | null;
  isMainDomain: boolean;
}

const SubdomainContext = createContext<SubdomainContextType | undefined>(undefined);

export function SubdomainProvider({ children }: { children: ReactNode }) {
  const subdomainData = useSubdomain();

  return (
    <SubdomainContext.Provider value={subdomainData}>
      {children}
    </SubdomainContext.Provider>
  );
}

export function useSubdomainContext() {
  const context = useContext(SubdomainContext);
  if (context === undefined) {
    throw new Error('useSubdomainContext must be used within a SubdomainProvider');
  }
  return context;
}
