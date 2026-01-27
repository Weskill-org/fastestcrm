// Travel & Hospitality Industry - Lead Fields Configuration

export interface TravelLeadFields {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Travel-specific fields
  destination: string | null;
  travel_date: string | null;
  return_date: string | null;
  travelers_count: number | null;
  trip_type: string | null;
  package_type: string | null;
  budget: number | null;
  special_requests: string | null;
  
  // Booking details
  booking_id: string | null;
  hotel_name: string | null;
  flight_details: string | null;
  package_cost: number | null;
  advance_paid: number | null;
  balance_due: number | null;
  
  revenue_projected: number | null;
  revenue_received: number | null;
}

export const TRAVEL_LEAD_COLUMNS = [
  { key: 'name', label: 'Guest Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'destination', label: 'Destination', type: 'text', required: false },
  { key: 'travel_date', label: 'Travel Date', type: 'date', required: false },
  { key: 'return_date', label: 'Return Date', type: 'date', required: false },
  { key: 'travelers_count', label: 'No. of Travelers', type: 'number', required: false },
  { key: 'trip_type', label: 'Trip Type', type: 'select', required: false },
  { key: 'package_type', label: 'Package Type', type: 'select', required: false },
  { key: 'budget', label: 'Budget', type: 'currency', required: false },
  { key: 'special_requests', label: 'Special Requests', type: 'textarea', required: false },
  { key: 'hotel_name', label: 'Hotel', type: 'text', required: false },
  { key: 'package_cost', label: 'Package Cost', type: 'currency', required: false },
  { key: 'advance_paid', label: 'Advance Paid', type: 'currency', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const TRAVEL_STATUSES = [
  { value: 'new', label: 'New Enquiry', color: '#3B82F6', category: 'new' },
  { value: 'quote_sent', label: 'Quote Sent', color: '#8B5CF6', category: 'interested' },
  { value: 'negotiating', label: 'Negotiating', color: '#F59E0B', category: 'interested' },
  { value: 'booked', label: 'Booked', color: '#22C55E', category: 'paid' },
  { value: 'partial_payment', label: 'Partial Payment', color: '#6366F1', category: 'paid' },
  { value: 'full_payment', label: 'Full Payment', color: '#10B981', category: 'paid' },
  { value: 'trip_started', label: 'Trip Started', color: '#EC4899', category: 'paid' },
  { value: 'completed', label: 'Trip Completed', color: '#14B8A6', category: 'paid' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444', category: 'other' },
  { value: 'not_interested', label: 'Not Interested', color: '#6B7280', category: 'other' },
];

export const TRIP_TYPES = [
  'Domestic',
  'International',
  'Honeymoon',
  'Family',
  'Corporate',
  'Adventure',
  'Pilgrimage',
];
