// SaaS & Technology Industry - Lead Fields Configuration

export interface SaaSLeadFields {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // SaaS-specific fields
  company_name: string | null;
  company_size: string | null;
  job_title: string | null;
  product_interest: string | null;
  use_case: string | null;
  current_solution: string | null;
  demo_date: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  
  // Subscription details
  plan_type: string | null;
  seats: number | null;
  monthly_value: number | null;
  annual_value: number | null;
  contract_length: number | null;
  
  revenue_projected: number | null;
  revenue_received: number | null;
}

export const SAAS_LEAD_COLUMNS = [
  { key: 'name', label: 'Contact Name', type: 'text', required: true },
  { key: 'email', label: 'Work Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'company_name', label: 'Company', type: 'text', required: false },
  { key: 'company_size', label: 'Company Size', type: 'select', required: false },
  { key: 'job_title', label: 'Job Title', type: 'text', required: false },
  { key: 'product_interest', label: 'Product Interest', type: 'text', required: false },
  { key: 'use_case', label: 'Use Case', type: 'textarea', required: false },
  { key: 'current_solution', label: 'Current Solution', type: 'text', required: false },
  { key: 'demo_date', label: 'Demo Date', type: 'date', required: false },
  { key: 'trial_start_date', label: 'Trial Start', type: 'date', required: false },
  { key: 'trial_end_date', label: 'Trial End', type: 'date', required: false },
  { key: 'plan_type', label: 'Plan Type', type: 'select', required: false },
  { key: 'seats', label: 'Seats', type: 'number', required: false },
  { key: 'monthly_value', label: 'MRR', type: 'currency', required: false },
  { key: 'annual_value', label: 'ARR', type: 'currency', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const SAAS_STATUSES = [
  { value: 'new', label: 'New Lead', color: '#3B82F6', category: 'new' },
  { value: 'mql', label: 'MQL', color: '#8B5CF6', category: 'interested' },
  { value: 'sql', label: 'SQL', color: '#10B981', category: 'interested' },
  { value: 'demo_scheduled', label: 'Demo Scheduled', color: '#F59E0B', category: 'interested' },
  { value: 'demo_done', label: 'Demo Done', color: '#6366F1', category: 'interested' },
  { value: 'trial_active', label: 'Trial Active', color: '#EC4899', category: 'interested' },
  { value: 'proposal_sent', label: 'Proposal Sent', color: '#F97316', category: 'interested' },
  { value: 'negotiation', label: 'Negotiation', color: '#EAB308', category: 'interested' },
  { value: 'won', label: 'Closed Won', color: '#22C55E', category: 'paid' },
  { value: 'onboarding', label: 'Onboarding', color: '#14B8A6', category: 'paid' },
  { value: 'active', label: 'Active Customer', color: '#10B981', category: 'paid' },
  { value: 'churned', label: 'Churned', color: '#EF4444', category: 'other' },
  { value: 'lost', label: 'Closed Lost', color: '#6B7280', category: 'other' },
];

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
];

export const PLAN_TYPES = [
  'Free',
  'Starter',
  'Professional',
  'Business',
  'Enterprise',
  'Custom',
];
