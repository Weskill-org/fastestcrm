/**
 * SubdomainGate
 *
 * Decides what to render based on the resolved domain type:
 *
 *  ① isMainDomain  → show mainDomainContent  (landing, marketing pages, etc.)
 *  ② isSubdomain with company found → show children (full CRM app)
 *  ③ Custom domain with company found → show children (full CRM app)
 *  ④ Subdomain/custom domain still loading → show spinner
 *  ⑤ Subdomain with error (not found / inactive) → show error page
 *  ⑥ Custom domain with no company match → fail-open, show mainDomainContent
 */

import { useSubdomainContext } from '@/contexts/SubdomainContext';
import { Loader2 } from 'lucide-react';

interface SubdomainGateProps {
  children: React.ReactNode;
  mainDomainContent: React.ReactNode;
}

export function SubdomainGate({ children, mainDomainContent }: SubdomainGateProps) {
  const { isSubdomain, loading, error, company, isMainDomain } = useSubdomainContext();

  // ① Main domain (fastestcrm.com / www / localhost / preview) — fast path
  if (isMainDomain) {
    return <>{mainDomainContent}</>;
  }

  // ② Still resolving the domain — wait before committing to a route tree
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    );
  }

  // ③ Subdomain resolved to an error (workspace not found / inactive)
  if (error && isSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Workspace Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a
            href="https://fastestcrm.com"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to FastestCRM
          </a>
        </div>
      </div>
    );
  }

  // ④ We're on a company subdomain or custom domain with a resolved company
  //    → render the full CRM app tree
  if (company) {
    return <>{children}</>;
  }

  // ⑤ Edge case: not main-domain, not loading, no error, no company
  //    (e.g. a custom domain where the lookup returned nothing)
  //    Fail-open: don't block the user; show children (which routes to /auth)
  return <>{children}</>;
}
