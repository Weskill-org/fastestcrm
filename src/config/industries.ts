// Industry configuration for CRM
// Each industry has distinct layouts, components, and logic

export type IndustryType = 
  | 'education'
  | 'real_estate'
  | 'healthcare'
  | 'insurance'
  | 'automotive'
  | 'finance'
  | 'retail'
  | 'travel'
  | 'saas';

export interface Industry {
  id: IndustryType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  features: string[];
}

export const INDUSTRIES: Industry[] = [
  {
    id: 'education',
    name: 'Education',
    description: 'Colleges, coaching centers, ed-tech companies',
    icon: 'GraduationCap',
    features: ['Student tracking', 'Course management', 'Batch scheduling', 'Fee collection']
  },
  {
    id: 'real_estate',
    name: 'Real Estate',
    description: 'Property dealers, builders, brokers',
    icon: 'Building2',
    features: ['Property listings', 'Site visits', 'Deal pipeline', 'Commission tracking']
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Hospitals, clinics, diagnostic centers',
    icon: 'Heart',
    features: ['Patient management', 'Appointment booking', 'Treatment tracking', 'Follow-ups']
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Insurance agents, brokers, companies',
    icon: 'Shield',
    features: ['Policy management', 'Renewal tracking', 'Claims processing', 'Agent hierarchy']
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car dealers, showrooms, service centers',
    icon: 'Car',
    features: ['Vehicle inventory', 'Test drives', 'Finance options', 'Service bookings']
  },
  {
    id: 'finance',
    name: 'Finance & Banking',
    description: 'Banks, NBFCs, loan providers',
    icon: 'Landmark',
    features: ['Loan applications', 'Credit assessment', 'EMI tracking', 'Document verification']
  },
  {
    id: 'retail',
    name: 'Retail & E-commerce',
    description: 'Retail stores, online sellers, distributors',
    icon: 'ShoppingCart',
    features: ['Order management', 'Inventory tracking', 'Customer loyalty', 'Returns handling']
  },
  {
    id: 'travel',
    name: 'Travel & Hospitality',
    description: 'Travel agents, hotels, tour operators',
    icon: 'Plane',
    features: ['Booking management', 'Itinerary planning', 'Package deals', 'Guest tracking']
  },
  {
    id: 'saas',
    name: 'SaaS & Technology',
    description: 'Software companies, IT services, startups',
    icon: 'Code',
    features: ['Demo scheduling', 'Trial management', 'Subscription tracking', 'Onboarding']
  }
];

export const INDUSTRY_CHANGE_FEE = 10000; // Rs. 10,000 to change industry

export function getIndustryById(id: IndustryType): Industry | undefined {
  return INDUSTRIES.find(i => i.id === id);
}

export function getIndustryName(id: IndustryType): string {
  return getIndustryById(id)?.name || id;
}
