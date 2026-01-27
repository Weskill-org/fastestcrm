// Finance & Banking Industry - Lead Fields Configuration

export interface FinanceLeadFields {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Finance-specific fields
  loan_type: string | null;
  loan_amount: number | null;
  annual_income: number | null;
  employment_type: string | null;
  company_name: string | null;
  credit_score: number | null;
  existing_loans: string | null;
  property_value: number | null;
  
  // Application details
  application_id: string | null;
  sanction_amount: number | null;
  interest_rate: number | null;
  tenure_months: number | null;
  emi_amount: number | null;
  disbursement_date: string | null;
  
  revenue_projected: number | null;
  revenue_received: number | null;
}

export const FINANCE_LEAD_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'loan_type', label: 'Loan Type', type: 'select', required: false },
  { key: 'loan_amount', label: 'Loan Amount', type: 'currency', required: false },
  { key: 'annual_income', label: 'Annual Income', type: 'currency', required: false },
  { key: 'employment_type', label: 'Employment Type', type: 'select', required: false },
  { key: 'company_name', label: 'Company Name', type: 'text', required: false },
  { key: 'credit_score', label: 'Credit Score', type: 'number', required: false },
  { key: 'existing_loans', label: 'Existing Loans', type: 'text', required: false },
  { key: 'property_value', label: 'Property Value', type: 'currency', required: false },
  { key: 'sanction_amount', label: 'Sanctioned Amount', type: 'currency', required: false },
  { key: 'interest_rate', label: 'Interest Rate (%)', type: 'number', required: false },
  { key: 'tenure_months', label: 'Tenure (Months)', type: 'number', required: false },
  { key: 'emi_amount', label: 'EMI Amount', type: 'currency', required: false },
  { key: 'disbursement_date', label: 'Disbursement Date', type: 'date', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const FINANCE_STATUSES = [
  { value: 'new', label: 'New Application', color: '#3B82F6', category: 'new' },
  { value: 'documents_pending', label: 'Documents Pending', color: '#F59E0B', category: 'interested' },
  { value: 'documents_received', label: 'Documents Received', color: '#8B5CF6', category: 'interested' },
  { value: 'verification', label: 'Under Verification', color: '#6366F1', category: 'interested' },
  { value: 'credit_check', label: 'Credit Check', color: '#EC4899', category: 'interested' },
  { value: 'sanctioned', label: 'Sanctioned', color: '#22C55E', category: 'paid' },
  { value: 'disbursed', label: 'Disbursed', color: '#14B8A6', category: 'paid' },
  { value: 'rejected', label: 'Rejected', color: '#EF4444', category: 'other' },
  { value: 'cancelled', label: 'Cancelled', color: '#6B7280', category: 'other' },
];

export const LOAN_TYPES = [
  'Home Loan',
  'Personal Loan',
  'Business Loan',
  'Car Loan',
  'Education Loan',
  'Gold Loan',
  'Loan Against Property',
  'Working Capital',
  'Credit Card',
];

export const EMPLOYMENT_TYPES = [
  'Salaried',
  'Self Employed',
  'Business Owner',
  'Professional',
  'Retired',
];
