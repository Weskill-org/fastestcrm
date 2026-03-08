import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Mail, MailOpen, Reply, Inbox, RefreshCw, PenSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ViewMode = 'inbox' | 'compose' | 'read';

interface EmailMessage {
  id: string;
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  toRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  receivedDateTime: string;
  isRead: boolean;
  bodyPreview: string;
  body: { contentType: string; content: string };
  hasAttachments: boolean;
}

export default function EmailDashboard() {
  const { user } = useAuth();
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const { data: emailData, isLoading, refetch } = useQuery({
    queryKey: ['emails', company?.id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/email-proxy?folder=inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch emails');
      }
      return res.json();
    },
    enabled: !!company?.id,
  });

  const sendEmail = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/email-proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          to: composeTo,
          subject: composeSubject,
          bodyContent: composeBody.replace(/\n/g, '<br/>'),
          replyToId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(replyToId ? 'Reply sent!' : 'Email sent!');
      setViewMode('inbox');
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await fetch(`https://${projectId}.supabase.co/functions/v1/email-proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markRead', messageId }),
      });
    },
  });

  const handleOpenEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setViewMode('read');
    if (!email.isRead) {
      markRead.mutate(email.id);
    }
  };

  const handleReply = (email: EmailMessage) => {
    setComposeTo(email.from.emailAddress.address);
    setComposeSubject(`Re: ${email.subject}`);
    setComposeBody('');
    setReplyToId(email.id);
    setViewMode('compose');
  };

  const messages: EmailMessage[] = emailData?.messages || [];
  const aliasEmail = emailData?.alias;

  return (
    <div className="p-4 md:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> Email
          </h1>
          {aliasEmail && (
            <p className="text-sm text-muted-foreground">Viewing as: {aliasEmail}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => { setViewMode('compose'); setReplyToId(null); setComposeTo(''); setComposeSubject(''); setComposeBody(''); }}>
            <PenSquare className="h-4 w-4 mr-1" /> Compose
          </Button>
        </div>
      </div>

      {/* Compose View */}
      {viewMode === 'compose' && (
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{replyToId ? 'Reply' : 'New Email'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setViewMode('inbox')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </div>
            <div>
              <Input placeholder="To" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} />
            </div>
            <div>
              <Input placeholder="Subject" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
            </div>
            <div>
              <Textarea
                placeholder="Write your email..."
                className="min-h-[200px]"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
            </div>
            <Button
              onClick={() => sendEmail.mutate()}
              disabled={!composeTo || !composeSubject || !composeBody || sendEmail.isPending}
            >
              {sendEmail.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {replyToId ? 'Send Reply' : 'Send Email'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Read View */}
      {viewMode === 'read' && selectedEmail && (
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setViewMode('inbox')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inbox
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReply(selectedEmail)}>
                <Reply className="h-4 w-4 mr-1" /> Reply
              </Button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedEmail.subject}</h2>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedEmail.from.emailAddress.name || selectedEmail.from.emailAddress.address}</span>
                <span>•</span>
                <span>{format(new Date(selectedEmail.receivedDateTime), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                To: {selectedEmail.toRecipients.map(r => r.emailAddress.address).join(', ')}
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body?.content || selectedEmail.bodyPreview }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inbox View */}
      {viewMode === 'inbox' && (
        <>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No emails found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {aliasEmail ? `No emails for ${aliasEmail}` : 'Connect an email alias to get started'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {messages.map((email) => (
                <Card
                  key={email.id}
                  className={`bg-card border-border cursor-pointer transition-colors hover:bg-accent/50 ${!email.isRead ? 'border-l-2 border-l-primary' : ''}`}
                  onClick={() => handleOpenEmail(email)}
                >
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="shrink-0">
                      {email.isRead ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${!email.isRead ? 'font-bold text-foreground' : 'text-foreground'}`}>
                          {email.from.emailAddress.name || email.from.emailAddress.address}
                        </span>
                        {email.hasAttachments && (
                          <Badge variant="outline" className="text-xs shrink-0">📎</Badge>
                        )}
                      </div>
                      <p className={`text-sm truncate ${!email.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{email.bodyPreview}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(email.receivedDateTime), 'MMM d')}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
