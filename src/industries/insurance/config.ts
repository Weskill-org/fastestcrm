// Insurance Industry - Lead Fields Configuration

export interface InsuranceLeadFields {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Insurance-specific fields
  insurance_type: string | null;
  sum_insured: number | null;
  premium_amount: number | null;
  policy_term: number | null;
  existing_policies: string | null;
  age: number | null;
  occupation: string | null;
  annual_income: number | null;
  nominee_name: string | null;
  agent_name: string | null;
  
  // Policy details
  policy_number: string | null;
  policy_start_date: string | null;
  renewal_date: string | null;
  
  revenue_projected: number | null;
  revenue_received: number | null;
}

export const INSURANCE_LEAD_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'age', label: 'Age', type: 'number', required: false },
  { key: 'occupation', label: 'Occupation', type: 'text', required: false },
  { key: 'annual_income', label: 'Annual Income', type: 'currency', required: false },
  { key: 'insurance_type', label: 'Insurance Type', type: 'select', required: false },
  { key: 'sum_insured', label: 'Sum Insured', type: 'currency', required: false },
  { key: 'premium_amount', label: 'Premium Amount', type: 'currency', required: false },
  { key: 'policy_term', label: 'Policy Term (Years)', type: 'number', required: false },
  { key: 'existing_policies', label: 'Existing Policies', type: 'text', required: false },
  { key: 'agent_name', label: 'Agent Name', type: 'text', required: false },
  { key: 'policy_number', label: 'Policy Number', type: 'text', required: false },
  { key: 'policy_start_date', label: 'Policy Start Date', type: 'date', required: false },
  { key: 'renewal_date', label: 'Renewal Date', type: 'date', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const INSURANCE_STATUSES = [
  { value: 'new', label: 'New Lead', color: '#3B82F6', category: 'new' },
  { value: 'contacted', label: 'Contacted', color: '#8B5CF6', category: 'interested' },
  { value: 'quote_shared', label: 'Quote Shared', color: '#F59E0B', category: 'interested' },
  { value: 'documents_pending', label: 'Documents Pending', color: '#6366F1', category: 'interested' },
  { value: 'underwriting', label: 'Under Review', color: '#EC4899', category: 'interested' },
  { value: 'policy_issued', label: 'Policy Issued', color: '#22C55E', category: 'paid' },
  { value: 'renewal_due', label: 'Renewal Due', color: '#F97316', category: 'interested' },
  { value: 'renewed', label: 'Renewed', color: '#14B8A6', category: 'paid' },
  { value: 'lapsed', label: 'Lapsed', color: '#EF4444', category: 'other' },
  { value: 'not_interested', label: 'Not Interested', color: '#6B7280', category: 'other' },
];

export const INSURANCE_TYPES = [
  'Life Insurance',
  'Health Insurance',
  'Motor Insurance',
  'Home Insurance',
  'Travel Insurance',
  'Business Insurance',
  'Term Insurance',
  'ULIP',
  'Endowment Plan',
];
