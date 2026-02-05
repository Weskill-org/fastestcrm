import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { Loader2, Copy, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MetaAdsSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  existingIntegration?: {
    id: string;
    page_name: string | null;
    default_lead_status: string | null;
    webhook_verify_token: string | null;
  } | null;
}

export function MetaAdsSetupDialog({ isOpen, onOpenChange, onComplete, existingIntegration }: MetaAdsSetupDialogProps) {
  const { company } = useCompany();
  const { statuses } = useLeadStatuses();
  const { toast } = useToast();
  
  const [step, setStep] = useState(existingIntegration ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState(existingIntegration?.page_name || '');
  const [defaultStatus, setDefaultStatus] = useState(existingIntegration?.default_lead_status || 'new');
  const [webhookToken, setWebhookToken] = useState(existingIntegration?.webhook_verify_token || '');
  const [copied, setCopied] = useState(false);

  // Generate webhook URL
  const webhookUrl = `https://uykdyqdeyilpulaqlqip.supabase.co/functions/v1/meta-lead-webhook`;

  const generateVerifyToken = () => {
    const token = crypto.randomUUID();
    setWebhookToken(token);
    return token;
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIntegration = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      const verifyToken = webhookToken || generateVerifyToken();
      
      const integrationData = {
        company_id: company.id,
        platform: 'meta',
        is_active: true,
        access_token: accessToken || null,
        page_id: pageId || null,
        page_name: pageName || 'Meta Ads',
        default_lead_status: defaultStatus,
        webhook_verify_token: verifyToken
      };

      if (existingIntegration?.id) {
        const { error } = await supabase
          .from('performance_marketing_integrations' as any)
          .update(integrationData)
          .eq('id', existingIntegration.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('performance_marketing_integrations' as any)
          .insert(integrationData);
        
        if (error) throw error;
      }

      toast({
        title: 'Meta Ads Integration Saved',
        description: 'Your webhook is ready to receive leads.',
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To integrate with Meta Lead Ads, you need a Meta Business account with Lead Ads access.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h4 className="font-medium">Step 1: Create a Meta App</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta for Developers</a></li>
                <li>Create a new app or use an existing one</li>
                <li>Add the "Webhooks" product to your app</li>
                <li>Add the "Marketing API" product for lead access</li>
              </ol>
              
              <Button className="w-full" onClick={() => setStep(2)}>
                Continue to Webhook Setup
              </Button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Step 2: Configure Webhook</h4>
            <p className="text-sm text-muted-foreground">
              In your Meta App Dashboard, go to Webhooks and subscribe to the "leadgen" field with these details:
            </p>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Callback URL</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Verify Token</Label>
                <div className="flex gap-2">
                  <Input 
                    value={webhookToken} 
                    readOnly 
                    placeholder="Click generate to create token"
                    className="font-mono text-xs" 
                  />
                  <Button variant="outline" onClick={() => generateVerifyToken()}>
                    Generate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(webhookToken)}
                    disabled={!webhookToken}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                After configuring the webhook, subscribe your Facebook Page to the app to receive lead notifications.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!webhookToken}>
                Continue to Settings
              </Button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Step 3: Configure Lead Settings</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageName">Facebook Page Name (for reference)</Label>
                <Input
                  id="pageName"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  placeholder="e.g., My Business Page"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pageId">Facebook Page ID (optional)</Label>
                <Input
                  id="pageId"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="e.g., 123456789"
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Facebook Page settings under "Page Transparency"
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Default Lead Status</Label>
                <Select value={defaultStatus} onValueChange={setDefaultStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status for new leads" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
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
                  Leads from Meta will be created with this status
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessToken">Page Access Token (optional)</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter long-lived access token"
                />
                <p className="text-xs text-muted-foreground">
                  Required only if you want to fetch lead details from Meta API
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!existingIntegration && (
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              )}
              <Button 
                className="flex-1" 
                onClick={handleSaveIntegration}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingIntegration ? 'Update Integration' : 'Complete Setup'}
              </Button>
            </div>
            
            {existingIntegration && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Your Webhook URL:</p>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg viewBox="0 0 36 36" className="w-6 h-6">
              <defs>
                <linearGradient id="meta-gradient-sm" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#0668E1"/>
                  <stop offset="100%" stopColor="#0080FB"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="18" fill="url(#meta-gradient-sm)"/>
            </svg>
            Meta Lead Ads Integration
          </DialogTitle>
          <DialogDescription>
            Receive leads from Facebook and Instagram Lead Ads in real-time
          </DialogDescription>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
