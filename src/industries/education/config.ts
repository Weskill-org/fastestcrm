// Education Industry - Lead Fields Configuration
// This configuration defines the lead fields specific to the education industry

export interface EducationLeadFields {
  // Core fields (shared across industries)
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Education-specific fields
  college: string | null;
  branch: string | null;
  graduating_year: number | null;
  cgpa: number | null;
  domain: string | null;
  preferred_language: string | null;
  batch_month: string | null;
  ca_name: string | null;
  
  // Course/Program fields
  product_purchased: string | null;
  product_category: string | null;
  
  // Financial fields
  revenue_projected: number | null;
  revenue_received: number | null;
  total_recovered: number | null;
  payment_link: string | null;
}

export const EDUCATION_LEAD_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'whatsapp', label: 'WhatsApp', type: 'phone', required: false },
  { key: 'college', label: 'College/Institution', type: 'text', required: false },
  { key: 'branch', label: 'Branch/Stream', type: 'text', required: false },
  { key: 'graduating_year', label: 'Graduating Year', type: 'number', required: false },
  { key: 'cgpa', label: 'CGPA/Percentage', type: 'number', required: false },
  { key: 'domain', label: 'Domain/Specialization', type: 'text', required: false },
  { key: 'preferred_language', label: 'Preferred Language', type: 'text', required: false },
  { key: 'batch_month', label: 'Batch Month', type: 'text', required: false },
  { key: 'ca_name', label: 'Campus Ambassador', type: 'text', required: false },
  { key: 'product_purchased', label: 'Course Enrolled', type: 'text', required: false },
  { key: 'product_category', label: 'Course Category', type: 'text', required: false },
  { key: 'revenue_projected', label: 'Fee Expected', type: 'currency', required: false },
  { key: 'revenue_received', label: 'Fee Received', type: 'currency', required: false },
  { key: 'total_recovered', label: 'Total Recovered', type: 'currency', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const EDUCATION_STATUSES = [
  { value: 'new', label: 'New Lead', color: '#3B82F6', category: 'new' },
  { value: 'contacted', label: 'Contacted', color: '#8B5CF6', category: 'interested' },
  { value: 'interested', label: 'Interested', color: '#10B981', category: 'interested' },
  { value: 'demo_scheduled', label: 'Demo Scheduled', color: '#F59E0B', category: 'interested' },
  { value: 'demo_done', label: 'Demo Completed', color: '#6366F1', category: 'interested' },
  { value: 'enrolled', label: 'Enrolled', color: '#22C55E', category: 'paid' },
  { value: 'payment_pending', label: 'Payment Pending', color: '#EF4444', category: 'interested' },
  { value: 'not_interested', label: 'Not Interested', color: '#6B7280', category: 'other' },
  { value: 'follow_up', label: 'Follow Up', color: '#F97316', category: 'interested' },
  { value: 'rnr', label: 'RNR', color: '#9CA3AF', category: 'other' },
  { value: 'dnd', label: 'DND', color: '#DC2626', category: 'other' },
];

export const EDUCATION_PRODUCT_CATEGORIES = [
  'Web Development',
  'Data Science',
  'Digital Marketing',
  'Finance',
  'Design',
  'MBA Prep',
  'CAT Coaching',
  'JEE/NEET Prep',
  'Language Learning',
  'Certification Course',
  'Degree Program',
];
