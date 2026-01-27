// Retail & E-commerce Industry - Lead Fields Configuration

export interface RetailLeadFields {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Retail-specific fields
  customer_type: string | null;
  order_value: number | null;
  products_interested: string | null;
  last_purchase_date: string | null;
  purchase_frequency: string | null;
  loyalty_points: number | null;
  
  // Order details
  order_id: string | null;
  order_status: string | null;
  payment_mode: string | null;
  delivery_address: string | null;
  delivery_date: string | null;
  
  revenue_projected: number | null;
  revenue_received: number | null;
}

export const RETAIL_LEAD_COLUMNS = [
  { key: 'name', label: 'Customer Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'customer_type', label: 'Customer Type', type: 'select', required: false },
  { key: 'products_interested', label: 'Products Interested', type: 'text', required: false },
  { key: 'order_value', label: 'Order Value', type: 'currency', required: false },
  { key: 'last_purchase_date', label: 'Last Purchase', type: 'date', required: false },
  { key: 'loyalty_points', label: 'Loyalty Points', type: 'number', required: false },
  { key: 'order_id', label: 'Order ID', type: 'text', required: false },
  { key: 'payment_mode', label: 'Payment Mode', type: 'select', required: false },
  { key: 'delivery_address', label: 'Delivery Address', type: 'textarea', required: false },
  { key: 'delivery_date', label: 'Delivery Date', type: 'date', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const RETAIL_STATUSES = [
  { value: 'new', label: 'New Customer', color: '#3B82F6', category: 'new' },
  { value: 'browsing', label: 'Browsing', color: '#8B5CF6', category: 'interested' },
  { value: 'cart_added', label: 'Added to Cart', color: '#F59E0B', category: 'interested' },
  { value: 'order_placed', label: 'Order Placed', color: '#22C55E', category: 'paid' },
  { value: 'payment_pending', label: 'Payment Pending', color: '#6366F1', category: 'interested' },
  { value: 'shipped', label: 'Shipped', color: '#EC4899', category: 'paid' },
  { value: 'delivered', label: 'Delivered', color: '#14B8A6', category: 'paid' },
  { value: 'return_requested', label: 'Return Requested', color: '#F97316', category: 'other' },
  { value: 'refunded', label: 'Refunded', color: '#EF4444', category: 'other' },
  { value: 'loyal_customer', label: 'Loyal Customer', color: '#10B981', category: 'paid' },
];

export const CUSTOMER_TYPES = [
  'New',
  'Returning',
  'VIP',
  'Wholesale',
  'Retail',
];
