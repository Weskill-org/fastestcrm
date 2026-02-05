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
import { Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoogleAdsSetupDialogProps {
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

export function GoogleAdsSetupDialog({ isOpen, onOpenChange, onComplete, existingIntegration }: GoogleAdsSetupDialogProps) {
  const { company } = useCompany();
  const { statuses } = useLeadStatuses();
  const { toast } = useToast();
  
  const [step, setStep] = useState(existingIntegration ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState(existingIntegration?.page_name || '');
  const [defaultStatus, setDefaultStatus] = useState(existingIntegration?.default_lead_status || 'new');
  const [webhookKey, setWebhookKey] = useState(existingIntegration?.webhook_verify_token || '');
  const [copied, setCopied] = useState(false);

  // Generate webhook URL with company identifier
  const webhookUrl = `https://uykdyqdeyilpulaqlqip.supabase.co/functions/v1/google-lead-webhook?company=${company?.id}`;

  const generateWebhookKey = () => {
    const key = crypto.randomUUID().replace(/-/g, '').substring(0, 32);
    setWebhookKey(key);
    return key;
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
      const key = webhookKey || generateWebhookKey();
      
      const integrationData = {
        company_id: company.id,
        platform: 'google',
        is_active: true,
        page_name: accountName || 'Google Ads',
        default_lead_status: defaultStatus,
        webhook_verify_token: key
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
        title: 'Google Ads Integration Saved',
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
                Google Ads Lead Form Extensions allow you to capture leads directly from your Search, Display, and Video campaigns.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h4 className="font-medium">Step 1: Prerequisites</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>You need a Google Ads account with Lead Form Extensions enabled</li>
                <li>Create a Lead Form asset in your Google Ads campaign</li>
                <li>The webhook integration is configured per lead form</li>
              </ol>
              
              <Button 
                className="w-full" 
                onClick={() => setStep(2)}
              >
                Continue to Webhook Setup
              </Button>
              
              <a 
                href="https://support.google.com/google-ads/answer/16729613" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary underline block text-center"
              >
                View Google's Official Guide →
              </a>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Step 2: Configure Webhook in Google Ads</h4>
            <p className="text-sm text-muted-foreground">
              When creating or editing a Lead Form asset, add these webhook details under "Other data integration options":
            </p>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
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
                <Label>Webhook Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={webhookKey} 
                    readOnly 
                    placeholder="Click generate to create key"
                    className="font-mono text-xs" 
                  />
                  <Button variant="outline" onClick={() => generateWebhookKey()}>
                    Generate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(webhookKey)}
                    disabled={!webhookKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This key validates that leads are coming from Google Ads
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                The webhook URL and key must be added to each Lead Form asset you want to sync.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!webhookKey}>
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
                <Label htmlFor="accountName">Google Ads Account Name (for reference)</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., My Business - Search Campaigns"
                />
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
                  Leads from Google Ads will be created with this status
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                Lead Source will be set as: <strong>Google Ads - [Campaign Name]</strong>
              </AlertDescription>
            </Alert>
            
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
            <svg viewBox="0 0 48 48" className="w-6 h-6">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Google Ads Integration
          </DialogTitle>
          <DialogDescription>
            Receive leads from Google Ads Lead Form Extensions in real-time
          </DialogDescription>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
