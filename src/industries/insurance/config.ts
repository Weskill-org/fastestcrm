// Insurance Industry - Lead Fields Configuration

export interface InsuranceLeadFields {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Insurance-specific fields
  insurance_type: string | null;
  plan_name: string | null;
  sum_insured: number | null;
  premium_amount: number | null;
  contribution_frequency: string | null;
  policy_term: number | null;
  existing_policies: string | null;
  age: number | null;
  gender: string | null;
  pan_number: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  annual_income: number | null;
  nominee_name: string | null;
  nominee_relation: string | null;
  agent_name: string | null;
  loss_reason: string | null;
  
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
  { key: 'whatsapp', label: 'WhatsApp', type: 'phone', required: false },
  { key: 'age', label: 'Age', type: 'number', required: false },
  { key: 'gender', label: 'Gender', type: 'select', required: false },
  { key: 'pan_number', label: 'PAN Number', type: 'text', required: false },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date', required: false },
  { key: 'occupation', label: 'Occupation', type: 'text', required: false },
  { key: 'annual_income', label: 'Annual Income', type: 'currency', required: false },
  { key: 'insurance_type', label: 'Insurance Type', type: 'select', required: false },
  { key: 'plan_name', label: 'Plan Name', type: 'text', required: false },
  { key: 'sum_insured', label: 'Sum Insured', type: 'currency', required: false },
  { key: 'premium_amount', label: 'Premium Amount', type: 'currency', required: false },
  { key: 'contribution_frequency', label: 'Contribution Frequency', type: 'select', required: false },
  { key: 'policy_term', label: 'Policy Term (Years)', type: 'number', required: false },
  { key: 'existing_policies', label: 'Existing Policies', type: 'text', required: false },
  { key: 'nominee_name', label: 'Nominee Name', type: 'text', required: false },
  { key: 'nominee_relation', label: 'Nominee Relation', type: 'select', required: false },
  { key: 'agent_name', label: 'Agent Name', type: 'text', required: false },
  { key: 'policy_number', label: 'Policy Number', type: 'text', required: false },
  { key: 'policy_start_date', label: 'Policy Start Date', type: 'date', required: false },
  { key: 'renewal_date', label: 'Renewal Date', type: 'date', required: false },
  { key: 'loss_reason', label: 'Loss Reason', type: 'select', required: false },
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

export const CONTRIBUTION_FREQUENCIES = [
  'Monthly',
  'Quarterly',
  'Bi-Yearly',
  'Yearly',
];

export const GENDERS = ['Male', 'Female', 'Other'];

export const NOMINEE_RELATIONS = [
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Other',
];

export const LOSS_REASONS = [
  'Too Expensive',
  'Has Existing Coverage',
  'Competitor Offer',
  'Not Interested',
  'Age Ineligible',
  'Health Issues',
  'Documentation Issues',
  'Changed Mind',
];
