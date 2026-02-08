import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Facebook, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { useQueryClient } from '@tanstack/react-query';

interface MetaAdsSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  existingIntegration?: {
    id: string;
    page_name: string | null;
    default_lead_status: string | null;
    webhook_verify_token: string | null;
  } | null;
}

type Step = 'connect' | 'select-page' | 'success';

interface FacebookPage {
  id: string;
  name: string;
}

// Meta App ID - this is public/publishable
const META_APP_ID = '1222309222740033';

export function MetaAdsSetupDialog({ isOpen, onOpenChange, onComplete, existingIntegration }: MetaAdsSetupDialogProps) {
  const { toast } = useToast();
  const { company } = useCompany();
  const { statuses } = useLeadStatuses();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<Step>('connect');
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [defaultStatus, setDefaultStatus] = useState(existingIntegration?.default_lead_status || 'new');
  const [connectedPage, setConnectedPage] = useState(existingIntegration?.page_name || '');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (existingIntegration?.page_name) {
        setStep('success');
        setConnectedPage(existingIntegration.page_name);
      } else {
        setStep('connect');
      }
      setPages([]);
      setSelectedPageId('');
    }
  }, [isOpen, existingIntegration]);

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'META_OAUTH_CALLBACK' && event.data?.code) {
        console.log('Received OAuth callback with code');
        await handleOAuthCallback(event.data.code);
      }
      if (event.data?.type === 'META_OAUTH_CALLBACK' && event.data?.error) {
        setIsLoading(false);
        toast({ 
          title: 'Facebook Login Failed', 
          description: event.data.error, 
          variant: 'destructive' 
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [company?.id, defaultStatus]);

  const handleFacebookLogin = () => {
    if (!company?.id) {
      toast({ title: 'Error', description: 'Company not found', variant: 'destructive' });
      return;
    }

    // Build OAuth URL with required permissions
    const redirectUri = `${window.location.origin}/meta-oauth-callback`;
    const scope = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'pages_manage_ads',
      'leads_retrieval',
      'ads_management',
      'business_management'
    ].join(',');

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${company.id}`;

    // Open popup for OAuth
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      authUrl,
      'meta-oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    setIsLoading(true);
  };

  const handleOAuthCallback = async (code: string) => {
    if (!company?.id) return;

    try {
      const redirectUri = `${window.location.origin}/meta-oauth-callback`;
      
      const { data, error } = await supabase.functions.invoke('meta-oauth-callback', {
        body: {
          code,
          redirectUri,
          companyId: company.id,
          defaultStatus
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.pages && data.pages.length > 0) {
        setPages(data.pages);
        setStep('select-page');
        toast({ title: 'Connected!', description: 'Now select a Facebook Page to receive leads from.' });
      } else {
        toast({ 
          title: 'No Pages Found', 
          description: 'You need a Facebook Page with Lead Ads to continue.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      toast({ title: 'Connection Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPage = async () => {
    if (!selectedPageId || !company?.id) return;

    const selectedPage = pages.find(p => p.id === selectedPageId);
    if (!selectedPage) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-select-page', {
        body: {
          companyId: company.id,
          pageId: selectedPageId,
          pageName: selectedPage.name
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setConnectedPage(selectedPage.name);
      setStep('success');
      
      // Invalidate queries to refresh integration status
      queryClient.invalidateQueries({ queryKey: ['performance-marketing-integrations'] });
      
      toast({ title: 'Success!', description: data.message });
      onComplete?.();
    } catch (err: any) {
      console.error('Select page error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Connect Meta Lead Ads
          </DialogTitle>
          <DialogDescription>
            {step === 'connect' && 'Login with Facebook to connect your Lead Ad forms.'}
            {step === 'select-page' && 'Select the Facebook Page to receive leads from.'}
            {step === 'success' && 'Your Meta Lead Ads are now connected!'}
          </DialogDescription>
        </DialogHeader>

        {step === 'connect' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Default Lead Status</Label>
              <Select value={defaultStatus} onValueChange={setDefaultStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status for new leads" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leads from Meta will be created with this status.
              </p>
            </div>

            <Button
              onClick={handleFacebookLogin}
              disabled={isLoading}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Facebook className="mr-2 h-4 w-4" />
                  Continue with Facebook
                </>
              )}
            </Button>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium">We'll request access to:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Your Facebook Pages</li>
                <li>Lead Ads forms & submissions</li>
                <li>Page engagement data</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'select-page' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Facebook Page</Label>
              <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map(page => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Lead form submissions from this page will sync to your CRM.
              </p>
            </div>

            <Button
              onClick={handleSelectPage}
              disabled={!selectedPageId || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Page...
                </>
              ) : (
                'Connect Page'
              )}
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 py-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Connected Successfully!</h3>
              <p className="text-muted-foreground">
                Leads from <span className="font-medium text-foreground">{connectedPage}</span> will now appear in your CRM automatically.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Important: Configure Meta Webhook</p>
                  <p>To receive leads in real-time, configure the webhook URL in your Meta App Dashboard under Webhooks → Page → leadgen.</p>
                </div>
              </div>
            </div>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
