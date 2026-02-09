import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubdomainContext } from '@/contexts/SubdomainContext';
import { useCompanyBranding } from '@/contexts/CompanyBrandingContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});



export default function Auth() {
  const [searchParams] = useSearchParams();

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const { isSubdomain, company: subdomainCompany } = useSubdomainContext();
  const { companyName, logoUrl, applyBranding } = useCompanyBranding();
  const { data: isPlatformAdmin, isLoading: isCheckingAdmin } = usePlatformAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect logic: platform admins go to /platform, others go to /dashboard
  useEffect(() => {
    if (user && !isCheckingAdmin) {
      if (isPlatformAdmin) {
        navigate('/platform');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isPlatformAdmin, isCheckingAdmin, navigate]);

  const validateForm = () => {
    setErrors({});
    try {
      loginSchema.parse({ email, password });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      z.string().email('Please enter a valid email').parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0].message });
      }
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a password reset link.',
        });
        setIsForgotPassword(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Sign in failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Show different back link based on subdomain */}
        {isSubdomain && subdomainCompany ? (
          <div className="mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              Signing in to <span className="font-medium text-foreground">{companyName || subdomainCompany.name}</span>
            </p>
          </div>
        ) : (
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        )}

        <Card className="glass border-border/50">
          <CardHeader className="text-center">
            {/* Company logo or default logo based on subdomain */}
            {applyBranding && logoUrl ? (
              <div className="mx-auto w-16 h-16 rounded-xl overflow-hidden mb-4 border border-border/50 bg-background/50">
                <img
                  src={logoUrl}
                  alt={companyName || 'Company logo'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : applyBranding && companyName ? (
              <div className="mx-auto w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            ) : (
              <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary-foreground">L³</span>
              </div>
            )}

            {/* Company name badge for subdomain */}
            {applyBranding && companyName && (
              <div className="mb-2">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {companyName}
                </span>
              </div>
            )}

            <CardTitle className="text-2xl">
              {isForgotPassword
                ? 'Reset your password'
                : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? 'Enter your email to receive a reset link'
                : applyBranding
                  ? `Sign in to ${companyName}'s workspace`
                  : 'Sign in to access your CRM dashboard'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name input removed */}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  {/* Signup removed as per request */}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          © 2025-∞ Fastest CRM by Upmarking.com. Built for Fastest Sales Teams.
        </footer>

      </div>
    </div>
  );
}