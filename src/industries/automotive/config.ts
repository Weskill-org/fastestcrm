// Automotive Industry - Lead Fields Configuration

export interface AutomotiveLeadFields {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Automotive-specific fields
  vehicle_interest: string | null;
  vehicle_model: string | null;
  vehicle_variant: string | null;
  budget: number | null;
  exchange_vehicle: string | null;
  exchange_value: number | null;
  test_drive_date: string | null;
  finance_required: boolean | null;
  finance_amount: number | null;
  
  // Deal details
  vehicle_price: number | null;
  discount_offered: number | null;
  final_price: number | null;
  booking_amount: number | null;
  delivery_date: string | null;
  
  revenue_projected: number | null;
  revenue_received: number | null;
}

export const AUTOMOTIVE_LEAD_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'vehicle_interest', label: 'Vehicle Interest', type: 'select', required: false },
  { key: 'vehicle_model', label: 'Model', type: 'text', required: false },
  { key: 'vehicle_variant', label: 'Variant', type: 'text', required: false },
  { key: 'budget', label: 'Budget', type: 'currency', required: false },
  { key: 'exchange_vehicle', label: 'Exchange Vehicle', type: 'text', required: false },
  { key: 'exchange_value', label: 'Exchange Value', type: 'currency', required: false },
  { key: 'test_drive_date', label: 'Test Drive Date', type: 'date', required: false },
  { key: 'finance_required', label: 'Finance Required', type: 'boolean', required: false },
  { key: 'finance_amount', label: 'Finance Amount', type: 'currency', required: false },
  { key: 'vehicle_price', label: 'Vehicle Price', type: 'currency', required: false },
  { key: 'booking_amount', label: 'Booking Amount', type: 'currency', required: false },
  { key: 'delivery_date', label: 'Delivery Date', type: 'date', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const AUTOMOTIVE_STATUSES = [
  { value: 'new', label: 'New Enquiry', color: '#3B82F6', category: 'new' },
  { value: 'contacted', label: 'Contacted', color: '#8B5CF6', category: 'interested' },
  { value: 'showroom_visit', label: 'Showroom Visit', color: '#10B981', category: 'interested' },
  { value: 'test_drive_scheduled', label: 'Test Drive Scheduled', color: '#F59E0B', category: 'interested' },
  { value: 'test_drive_done', label: 'Test Drive Done', color: '#6366F1', category: 'interested' },
  { value: 'negotiation', label: 'In Negotiation', color: '#EC4899', category: 'interested' },
  { value: 'booking_done', label: 'Booking Done', color: '#22C55E', category: 'paid' },
  { value: 'delivery_pending', label: 'Delivery Pending', color: '#F97316', category: 'paid' },
  { value: 'delivered', label: 'Delivered', color: '#14B8A6', category: 'paid' },
  { value: 'not_interested', label: 'Not Interested', color: '#6B7280', category: 'other' },
];

export const VEHICLE_TYPES = [
  'Hatchback',
  'Sedan',
  'SUV',
  'MUV',
  'Luxury',
  'Electric',
  'Two Wheeler',
  'Commercial',
];
