import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Loader2 } from 'lucide-react';
import { MetaAdsSetupDialog } from './MetaAdsSetupDialog';
import { GoogleAdsSetupDialog } from './GoogleAdsSetupDialog';
import { LinkedInAdsSetupDialog } from './LinkedInAdsSetupDialog';

// Platform logos as simple components
const MetaLogo = () => (
  <svg viewBox="0 0 36 36" className="w-8 h-8">
    <defs>
      <linearGradient id="meta-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#0668E1" />
        <stop offset="100%" stopColor="#0080FB" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="18" fill="url(#meta-gradient)" />
    <path d="M25.5 18c0-3.038-1.625-5.688-4.031-7.156-.281-.172-.594-.094-.781.156-.188.25-.125.594.125.781 2.094 1.281 3.438 3.563 3.438 6.219 0 2.656-1.344 4.938-3.438 6.219-.25.188-.313.531-.125.781.188.25.5.328.781.156C23.875 23.688 25.5 21.038 25.5 18zM12.5 18c0 2.656 1.344 4.938 3.438 6.219.25.188.313.531.125.781-.188.25-.5.328-.781.156C12.875 23.688 11.25 21.038 11.25 18s1.625-5.688 4.031-7.156c.281-.172.594-.094.781.156.188.25.125.594-.125.781C13.844 13.062 12.5 15.344 12.5 18z" fill="white" />
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

const LinkedInLogo = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8">
    <path fill="#0288D1" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z" />
    <path fill="#FFF" d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z" />
  </svg>
);

interface PerformanceMarketingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Integration {
  id: string;
  platform: string;
  is_active: boolean;
  page_name: string | null;
  ad_account_id: string | null;
  default_lead_status: string | null;
  webhook_verify_token: string | null;
  credentials?: any;
}

export function PerformanceMarketingDialog({ isOpen, onOpenChange }: PerformanceMarketingDialogProps) {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<'meta' | 'google' | 'linkedin' | null>(null);

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['performance-marketing-integrations', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('performance_marketing_integrations' as any)
        .select('*')
        .eq('company_id', company.id);

      if (error) throw error;
      return (data || []) as unknown as Integration[];
    },
    enabled: !!company?.id && isOpen
  });

  const getIntegration = (platform: string) => {
    return integrations?.find(i => i.platform === platform);
  };

  const platforms = [
    {
      id: 'meta',
      name: 'Meta (Facebook/Instagram)',
      description: 'Sync leads from Facebook & Instagram Lead Ads in real-time',
      logo: MetaLogo,
      color: 'bg-blue-500'
    },
    {
      id: 'google',
      name: 'Google Ads',
      description: 'Receive leads from Google Ads Lead Form Extensions instantly',
      logo: GoogleLogo,
      color: 'bg-green-500'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Ads',
      description: 'Capture leads from LinkedIn Lead Gen Forms automatically',
      logo: LinkedInLogo,
      color: 'bg-sky-600'
    }
  ];

  const handleSetupComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['performance-marketing-integrations'] });
    setSelectedPlatform(null);
  };

  return (
    <>
      <Dialog open={isOpen && !selectedPlatform} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Performance Marketing Integrations</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-6">
              Connect your ad platforms to automatically sync leads from your campaigns into your CRM in real-time.
            </p>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {platforms.map((platform) => {
                  const integration = getIntegration(platform.id);
                  const isConnected = integration?.is_active;

                  return (
                    <Card key={platform.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <platform.logo />
                            <div>
                              <CardTitle className="text-base">{platform.name}</CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {platform.description}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant={isConnected ? "default" : "outline"}
                            className={isConnected ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {isConnected ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center justify-between">
                          {isConnected && integration?.page_name && (
                            <span className="text-sm text-muted-foreground">
                              {integration.page_name}
                            </span>
                          )}
                          {!isConnected && <span />}
                          <Button
                            size="sm"
                            variant={isConnected ? "outline" : "default"}
                            onClick={() => setSelectedPlatform(platform.id as any)}
                          >
                            {isConnected ? 'Manage' : 'Connect'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MetaAdsSetupDialog
        isOpen={selectedPlatform === 'meta'}
        onOpenChange={(open) => !open && setSelectedPlatform(null)}
        onComplete={handleSetupComplete}
        existingIntegration={getIntegration('meta') ?? null}
      />

      <GoogleAdsSetupDialog
        isOpen={selectedPlatform === 'google'}
        onOpenChange={(open) => !open && setSelectedPlatform(null)}
        onComplete={handleSetupComplete}
        existingIntegration={getIntegration('google') ?? null}
      />

      <LinkedInAdsSetupDialog
        isOpen={selectedPlatform === 'linkedin'}
        onOpenChange={(open) => !open && setSelectedPlatform(null)}
        onComplete={handleSetupComplete}
        existingIntegration={getIntegration('linkedin') ?? null}
      />
    </>
  );
}
