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

interface LinkedInAdsSetupDialogProps {
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

export function LinkedInAdsSetupDialog({ isOpen, onOpenChange, onComplete, existingIntegration }: LinkedInAdsSetupDialogProps) {
  const { company } = useCompany();
  const { statuses } = useLeadStatuses();
  const { toast } = useToast();
  
  const [step, setStep] = useState(existingIntegration ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState(existingIntegration?.page_name || '');
  const [defaultStatus, setDefaultStatus] = useState(existingIntegration?.default_lead_status || 'new');
  const [clientSecret, setClientSecret] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate webhook URL
  const webhookUrl = `https://uykdyqdeyilpulaqlqip.supabase.co/functions/v1/linkedin-lead-webhook?company=${company?.id}`;

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIntegration = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      const integrationData = {
        company_id: company.id,
        platform: 'linkedin',
        is_active: true,
        page_name: accountName || 'LinkedIn Ads',
        default_lead_status: defaultStatus,
        webhook_verify_token: clientSecret || null
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
        title: 'LinkedIn Ads Integration Saved',
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
                LinkedIn Lead Gen Forms require a LinkedIn Developer App with Lead Sync API access.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h4 className="font-medium">Step 1: Create LinkedIn Developer App</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">LinkedIn Developer Portal</a></li>
                <li>Create a new app or select an existing one</li>
                <li>Request access to the "Lead Sync" API product</li>
                <li>You'll need Leads Viewer access on your Ad Account</li>
              </ol>
              
              <Button className="w-full" onClick={() => setStep(2)}>
                Continue to Webhook Setup
              </Button>
              
              <a 
                href="https://learn.microsoft.com/en-us/linkedin/shared/api-guide/webhook-validation" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary underline block text-center"
              >
                View LinkedIn Webhook Documentation →
              </a>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Step 2: Configure Webhook</h4>
            <p className="text-sm text-muted-foreground">
              Register this webhook URL in your LinkedIn Developer App's Webhooks tab:
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
                <Label htmlFor="clientSecret">App Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your LinkedIn app client secret"
                />
                <p className="text-xs text-muted-foreground">
                  Used for HMAC-SHA256 webhook validation (required by LinkedIn)
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                LinkedIn uses HMAC-SHA256 with your client secret to validate webhook requests. The validation must respond within 3 seconds.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
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
                <Label htmlFor="accountName">LinkedIn Company/Account Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., My Company LinkedIn"
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
                  Leads from LinkedIn will be created with this status
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                Lead Source will be set as: <strong>LinkedIn - [Campaign Name]</strong>
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
              <path fill="#0288D1" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"/>
              <path fill="#FFF" d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"/>
            </svg>
            LinkedIn Ads Integration
          </DialogTitle>
          <DialogDescription>
            Receive leads from LinkedIn Lead Gen Forms in real-time
          </DialogDescription>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
