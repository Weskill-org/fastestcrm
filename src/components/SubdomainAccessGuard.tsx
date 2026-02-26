/**
 * SubdomainAccessGuard
 *
 * Ensures that a logged-in user on a WRONG subdomain is redirected to their
 * own workspace subdomain.
 *
 * KEY RULES:
 *  • Main domain (fastestcrm.com) → always pass through — no redirects
 *  • Unauthenticated users → always pass through (login page handles them)
 *  • Auth/subdomain still loading → show minimal spinner
 *  • User's company = workspace company → pass through
 *  • Wrong subdomain mismatch → hard redirect to correct workspace
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
    // On the main domain — no redirect. Users stay on fastestcrm.com and load
    // their dashboard with company branding via useCompany.
    if (isMainDomain) return;

    // Wait for everything we need
    if (authLoading || subdomainLoading) return;
    // Not logged in — pass through (Auth page will handle)
    if (!user) return;

    // Still loading which company the user belongs to
    if (companyLoading) return;

    // User has no company yet (still being set up) — pass through
    if (!userCompany) return;

    // SCENARIO B: We are on a Workspace Domain (acme.fastestcrm.com or crm.acme.com)
    // If not a workspace domain, pass through
    if (!isWorkspaceDomain || !workspaceCompany) return;

    // Correct workspace — pass through
    if (userCompany.id === workspaceCompany.id) return;

    // Wrong subdomain mismatch — redirect once to the user's correct workspace
    if (!redirected.current) {
      redirected.current = true;
      const correctUrl = getWorkspaceUrl(userCompany.slug);
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

  // Only show a spinner when on a workspace subdomain and actively verifying access
  const isChecking =
    !isMainDomain &&
    (
      (subdomainLoading && isWorkspaceDomain) ||
      (user && companyLoading && isWorkspaceDomain && !!workspaceCompany)
    );

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
