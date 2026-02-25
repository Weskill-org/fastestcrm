import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubdomainContext } from '@/contexts/SubdomainContext';
import { useCompany } from '@/hooks/useCompany';
import { getWorkspaceUrl } from '@/hooks/useSubdomain';
import { Loader2 } from 'lucide-react';

interface SubdomainAccessGuardProps {
  children: React.ReactNode;
}

/**
 * SubdomainAccessGuard
 *
 * Ensures that a logged-in user can only access the workspace that belongs to
 * their company. If they land on a different company's subdomain/domain they
 * are redirected to their own workspace URL.
 *
 * Unauthenticated users are always let through — the Auth page is responsible
 * for sign-in before anything company-sensitive is shown.
 */
export function SubdomainAccessGuard({ children }: SubdomainAccessGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const {
    isSubdomain,
    isCustomDomain,
    company: workspaceCompany,
    loading: subdomainLoading,
  } = useSubdomainContext();
  const { company: userCompany, loading: companyLoading } = useCompany();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const isWorkspaceDomain = isSubdomain || isCustomDomain;

  useEffect(() => {
    if (authLoading || subdomainLoading || companyLoading) return;

    // Not yet logged in — let the Auth page handle everything
    if (!user) {
      setChecking(false);
      return;
    }

    // Not on a client workspace — allow access
    if (!isWorkspaceDomain || !workspaceCompany) {
      setChecking(false);
      return;
    }

    // User has no company yet — allow access (they may be setting one up)
    if (!userCompany) {
      setChecking(false);
      return;
    }

    // User's company matches the current workspace — allow access
    if (userCompany.id === workspaceCompany.id) {
      setChecking(false);
      return;
    }

    // Mismatch: redirect to the user's correct workspace
    const correctUrl = getWorkspaceUrl(userCompany.slug);
    const currentPath = window.location.pathname;
    window.location.href = `${correctUrl}${currentPath}`;
  }, [
    user,
    authLoading,
    isWorkspaceDomain,
    workspaceCompany,
    subdomainLoading,
    userCompany,
    companyLoading,
    navigate,
  ]);

  if (checking && (authLoading || subdomainLoading || companyLoading)) {
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
