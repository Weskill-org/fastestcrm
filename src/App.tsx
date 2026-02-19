import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubdomainProvider } from "@/contexts/SubdomainContext";
import { SubdomainGate } from "@/components/SubdomainGate";
import { CompanyBrandingProvider } from "@/contexts/CompanyBrandingContext";
import { SubdomainAccessGuard } from "@/components/SubdomainAccessGuard";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/page-loader";

// Critical path imports - kept static for faster LCP and smoother initial navigation
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import RegisterCompany from "./pages/RegisterCompany";
import ResetPassword from "./pages/ResetPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "./pages/NotFound";

// Lazy load non-critical routes to reduce initial bundle size
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AllLeads = lazy(() => import("./pages/AllLeads"));
const LGDashboard = lazy(() => import("./pages/LGDashboard"));
const Interested = lazy(() => import("./pages/Interested"));
const Paid = lazy(() => import("./pages/Paid"));
const PendingPayments = lazy(() => import("./pages/PendingPayments"));
const AutoDialer = lazy(() => import("./pages/AutoDialer"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const Team = lazy(() => import("./pages/Team"));
const Automations = lazy(() => import("./pages/Automations"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Settings = lazy(() => import("./pages/Settings"));
const Forms = lazy(() => import("./pages/Forms"));
const FormResponses = lazy(() => import("./pages/FormResponses"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));
const PublicForm = lazy(() => import("./pages/PublicForm"));
const ManageCompany = lazy(() => import("./pages/ManageCompany"));
const ManageStatuses = lazy(() => import("./pages/ManageStatuses"));
const ManageProducts = lazy(() => import("./pages/ManageProducts"));
const PlatformAdmin = lazy(() => import("./pages/PlatformAdmin"));
const RealEstateAllLeads = lazy(() => import("./industries/real_estate/RealEstateAllLeads"));
const ManageLeadProfiling = lazy(() => import("./industries/real_estate/ManageLeadProfiling"));
const ManageProperties = lazy(() => import("./industries/real_estate/pages/ManageProperties"));
const Report = lazy(() => import("./pages/Report"));
const MetaOAuthCallback = lazy(() => import("./pages/MetaOAuthCallback"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BigdataSQL = lazy(() => import("./pages/BigdataSQL"));

const queryClient = new QueryClient();

// Main domain routes (fastestcrm.com, www.fastestcrm.com, localhost, preview domains)
const MainDomainRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/lg" element={<LGDashboard />} />
        <Route path="/dashboard/leads" element={<AllLeads />} />
        <Route path="/dashboard/interested" element={<Interested />} />
        <Route path="/dashboard/paid" element={<Paid />} />
        <Route path="/dashboard/pending" element={<PendingPayments />} />
        <Route path="/dashboard/dialer" element={<AutoDialer />} />
        <Route path="/dashboard/report" element={<Report />} />
        <Route path="/dashboard/ai" element={<AIInsights />} />
        <Route path="/dashboard/team" element={<Team />} />
        <Route path="/dashboard/automations" element={<Automations />} />
        <Route path="/dashboard/integrations" element={<Integrations />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/forms" element={<Forms />} />
        <Route path="/dashboard/forms/:id/responses" element={<FormResponses />} />
        <Route path="/dashboard/forms/new" element={<FormBuilder />} />
        <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
        <Route path="/dashboard/company" element={<ManageCompany />} />
        <Route path="/dashboard/statuses" element={<ManageStatuses />} />
        <Route path="/dashboard/products" element={<ManageProducts />} />
        <Route path="/dashboard/real-estate-leads" element={<RealEstateAllLeads />} />
        <Route path="/dashboard/properties" element={<ManageProperties />} />
        <Route path="/dashboard/lead-profiling" element={<ManageLeadProfiling />} />
        <Route path="/dashboard/bigdata-sql" element={<BigdataSQL />} />
      </Route>

      <Route path="/platform" element={<PlatformAdmin />} />
      <Route path="/form/:id" element={<PublicForm />} />
      <Route path="/meta-oauth-callback" element={<MetaOAuthCallback />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

// Subdomain routes (company.fastestcrm.com) - can be customized per workspace
// Wrapped with SubdomainAccessGuard to ensure users can only access their own company's subdomain
const SubdomainRoutes = () => (
  <SubdomainAccessGuard>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* On subdomain, "/" goes directly to auth/dashboard, not landing */}
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/lg" element={<LGDashboard />} />
          <Route path="/dashboard/leads" element={<AllLeads />} />
          <Route path="/dashboard/interested" element={<Interested />} />
          <Route path="/dashboard/paid" element={<Paid />} />
          <Route path="/dashboard/pending" element={<PendingPayments />} />
          <Route path="/dashboard/dialer" element={<AutoDialer />} />
          <Route path="/dashboard/report" element={<Report />} />
          <Route path="/dashboard/ai" element={<AIInsights />} />
          <Route path="/dashboard/team" element={<Team />} />
          <Route path="/dashboard/automations" element={<Automations />} />
          <Route path="/dashboard/integrations" element={<Integrations />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/dashboard/forms" element={<Forms />} />
          <Route path="/dashboard/forms/:id/responses" element={<FormResponses />} />
          <Route path="/dashboard/forms/new" element={<FormBuilder />} />
          <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
          <Route path="/dashboard/company" element={<ManageCompany />} />
          <Route path="/dashboard/statuses" element={<ManageStatuses />} />
          <Route path="/dashboard/products" element={<ManageProducts />} />
          <Route path="/dashboard/real-estate-leads" element={<RealEstateAllLeads />} />
          <Route path="/dashboard/properties" element={<ManageProperties />} />
          <Route path="/dashboard/lead-profiling" element={<ManageLeadProfiling />} />
          <Route path="/dashboard/bigdata-sql" element={<BigdataSQL />} />
        </Route>

        <Route path="/form/:id" element={<PublicForm />} />
        <Route path="/meta-oauth-callback" element={<MetaOAuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </SubdomainAccessGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubdomainProvider>
        <CompanyBrandingProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SubdomainGate mainDomainContent={<MainDomainRoutes />}>
                <SubdomainRoutes />
              </SubdomainGate>
            </BrowserRouter>
          </AuthProvider>
        </CompanyBrandingProvider>
      </SubdomainProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
