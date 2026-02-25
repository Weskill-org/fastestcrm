/**
 * SubdomainAccessGuard
 *
 * Ensures that a logged-in user can only access the workspace that belongs to
 * their company. If they land on a different company's subdomain they are
 * redirected to their own workspace.
 *
 * KEY RULES:
 *  • Unauthenticated users → always pass through (login page handles them)
 *  • Auth/subdomain still loading → show minimal spinner
 *  • User's company = workspace company → pass through
 *  • Company mismatch → hard redirect to correct workspace
 *
 * Company lookup (useCompany) is only triggered AFTER the user is logged in,
 * so it never delays the login page render.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubdomainContext } from '@/contexts/SubdomainContext';
import { useCompany } from '@/hooks/useCompany';
import { getWorkspaceUrl } from '@/hooks/useSubdomain';
import { Loader2 } from 'lucide-react';

interface SubdomainAccessGuardProps {
  children: React.ReactNode;
}

export function SubdomainAccessGuard({ children }: SubdomainAccessGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const {
    isSubdomain,
    isCustomDomain,
    isMainDomain,
    company: workspaceCompany,
    loading: subdomainLoading,
  } = useSubdomainContext();
  const { company: userCompany, loading: companyLoading } = useCompany();
  const redirected = useRef(false);

  const isWorkspaceDomain = isSubdomain || isCustomDomain;

  useEffect(() => {
    // Wait for everything we need
    if (authLoading || subdomainLoading) return;
    // Not logged in — pass through (Auth page will handle)
    if (!user) return;

    // Still loading which company the user belongs to
    if (companyLoading) return;

    // User has no company yet (still being set up) — pass through
    if (!userCompany) return;

    // SCENARIO A: We are on the Main Domain (fastestcrm.com/dashboard)
    if (isMainDomain) {
      // User has a company, so they shouldn't be here. Redirect to their workspace.
      if (!redirected.current) {
        redirected.current = true;
        const correctUrl = getWorkspaceUrl(userCompany.slug);
        window.location.href = `${correctUrl}${window.location.pathname}`;
      }
      return;
    }

    // SCENARIO B: We are on a Workspace Domain (acme.fastestcrm.com or crm.acme.com)
    // If not a workspace domain (should be caught above, but TypeScript needs it), pass through
    if (!isWorkspaceDomain || !workspaceCompany) return;

    // Correct workspace — pass through
    if (userCompany.id === workspaceCompany.id) return;

    // Mismatch — redirect once to the user's correct workspace
    if (!redirected.current) {
      redirected.current = true;
      const correctUrl = getWorkspaceUrl(userCompany.slug);

      // If we are on the main domain, take them to the exact same path on their subdomain
      // If we are on a wrong subdomain, redirect them to the exact same path on their correct subdomain
      window.location.href = `${correctUrl}${window.location.pathname}`;
    }
  }, [
    user,
    authLoading,
    isWorkspaceDomain,
    isMainDomain,
    workspaceCompany,
    subdomainLoading,
    userCompany,
    companyLoading,
  ]);

  // Only show a spinner if we're actually waiting for something meaningful
  const isChecking =
    (authLoading && !user) ||
    (subdomainLoading && isWorkspaceDomain) ||
    (user && companyLoading && isWorkspaceDomain && !!workspaceCompany);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying workspace access…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
