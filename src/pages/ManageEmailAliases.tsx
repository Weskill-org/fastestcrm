import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManageEmailAliases() {
  const { user } = useAuth();
  const { company, isCompanyAdmin } = useCompany();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [aliasEmail, setAliasEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  // Fetch aliases
  const { data: aliasesData, isLoading } = useQuery({
    queryKey: ['email-aliases', company?.id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/manage-email-aliases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!company?.id && isCompanyAdmin,
  });

  // Fetch team members
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-for-alias', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('company_id', company.id);
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Fetch email integration to get domain
  const { data: integration } = useQuery({
    queryKey: ['email-integration', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      const { data } = await supabase
        .from('email_integrations' as any)
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!company?.id,
  });

  const createAlias = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/manage-email-aliases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser,
          alias_email: aliasEmail,
          display_name: displayName,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Alias created successfully');
      queryClient.invalidateQueries({ queryKey: ['email-aliases'] });
      setIsAddOpen(false);
      setSelectedUser('');
      setAliasEmail('');
      setDisplayName('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteAlias = useMutation({
    mutationFn: async (aliasId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/manage-email-aliases`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alias_id: aliasId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Alias removed');
      queryClient.invalidateQueries({ queryKey: ['email-aliases'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const aliases = aliasesData?.aliases || [];
  const domain = integration?.admin_email?.split('@')[1] || '';

  if (!isCompanyAdmin) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Only company admins can manage email aliases.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Settings</h1>
          <p className="text-muted-foreground">Manage email aliases for your team members</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Alias</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Email Alias</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Team Member</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger>
                  <SelectContent>
                    {teamMembers?.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alias Email Address</Label>
                <Input
                  placeholder={`e.g. sales@${domain || 'company.com'}`}
                  value={aliasEmail}
                  onChange={(e) => setAliasEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  placeholder="e.g. Sales Team"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createAlias.mutate()}
                disabled={!selectedUser || !aliasEmail || createAlias.isPending}
              >
                {createAlias.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Create Alias
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {integration && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Connected Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{integration.admin_email}</p>
            <p className="text-xs text-muted-foreground mt-1">Provider: {integration.provider}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : aliases.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No email aliases created yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create aliases to enable email for your team</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {aliases.map((alias: any) => (
            <Card key={alias.id} className="bg-card border-border">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{alias.alias_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {alias.display_name} • {alias.profiles?.full_name || 'Unknown user'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alias.is_active ? 'default' : 'outline'} className={alias.is_active ? 'bg-green-500' : ''}>
                    {alias.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlias.mutate(alias.id)}
                    disabled={deleteAlias.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
