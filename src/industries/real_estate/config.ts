// Real Estate Industry - Lead Fields Configuration
// This configuration defines the lead fields specific to the real estate industry

export interface RealEstateLeadFields {
  // Core fields (shared across industries)
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Real Estate-specific fields
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  property_size: string | null;
  purpose: 'buy' | 'rent' | 'invest' | null;
  possession_timeline: string | null;
  site_visit_date: string | null;
  broker_name: string | null;
  
  // Property details (when dealing)
  property_name: string | null;
  unit_number: string | null;
  deal_value: number | null;
  commission_percentage: number | null;
  commission_amount: number | null;
  
  // Financial fields
  revenue_projected: number | null;
  revenue_received: number | null;
  payment_link: string | null;
}

export const REAL_ESTATE_LEAD_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'whatsapp', label: 'WhatsApp', type: 'phone', required: false },
  { key: 'property_type', label: 'Property Type', type: 'select', required: false },
  { key: 'budget_min', label: 'Min Budget', type: 'currency', required: false },
  { key: 'budget_max', label: 'Max Budget', type: 'currency', required: false },
  { key: 'preferred_location', label: 'Preferred Location', type: 'text', required: false },
  { key: 'property_size', label: 'Property Size (sq ft)', type: 'text', required: false },
  { key: 'purpose', label: 'Purpose', type: 'select', required: false },
  { key: 'possession_timeline', label: 'Possession Timeline', type: 'text', required: false },
  { key: 'site_visit_date', label: 'Site Visit Date', type: 'date', required: false },
  { key: 'broker_name', label: 'Broker/Agent', type: 'text', required: false },
  { key: 'property_name', label: 'Property Name', type: 'text', required: false },
  { key: 'unit_number', label: 'Unit Number', type: 'text', required: false },
  { key: 'deal_value', label: 'Deal Value', type: 'currency', required: false },
  { key: 'commission_percentage', label: 'Commission %', type: 'number', required: false },
  { key: 'commission_amount', label: 'Commission Amount', type: 'currency', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const REAL_ESTATE_STATUSES = [
  { value: 'new', label: 'New Enquiry', color: '#3B82F6', category: 'new' },
  { value: 'contacted', label: 'Contacted', color: '#8B5CF6', category: 'interested' },
  { value: 'requirements_shared', label: 'Requirements Shared', color: '#10B981', category: 'interested' },
  { value: 'site_visit', label: 'Site Visit', color: '#F59E0B', category: 'interested', requiresDateTime: true },
  { value: 'site_visited', label: 'Site Visited', color: '#6366F1', category: 'interested' },
  { value: 'request_callback', label: 'Request Call Back', color: '#A855F7', category: 'interested', requiresDateTime: true },
  { value: 'negotiation', label: 'In Negotiation', color: '#EC4899', category: 'interested' },
  { value: 'booking_done', label: 'Booking Done', color: '#22C55E', category: 'paid' },
  { value: 'registration_pending', label: 'Registration Pending', color: '#F97316', category: 'paid' },
  { value: 'deal_closed', label: 'Deal Closed', color: '#14B8A6', category: 'paid' },
  { value: 'not_interested', label: 'Not Interested', color: '#6B7280', category: 'other' },
  { value: 'budget_issue', label: 'Budget Issue', color: '#EF4444', category: 'other' },
  { value: 'follow_up', label: 'Follow Up', color: '#F97316', category: 'interested' },
];

export const REAL_ESTATE_PROPERTY_TYPES = [
  'Apartment/Flat',
  'Villa',
  'Independent House',
  'Plot/Land',
  'Commercial Shop',
  'Commercial Office',
  'Warehouse',
  'Farmhouse',
  'Penthouse',
];

export const REAL_ESTATE_PURPOSES = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'invest', label: 'Investment' },
];
