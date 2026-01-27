// Healthcare Industry - Lead Fields Configuration
// This configuration defines the lead fields specific to the healthcare industry

export interface HealthcareLeadFields {
  // Core fields (shared across industries)
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  
  // Healthcare-specific fields
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  condition: string | null;
  symptoms: string | null;
  doctor_preference: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  department: string | null;
  referral_source: string | null;
  insurance_provider: string | null;
  insurance_id: string | null;
  
  // Treatment details
  treatment_type: string | null;
  treatment_cost: number | null;
  treatment_date: string | null;
  follow_up_date: string | null;
  
  // Financial fields
  revenue_projected: number | null;
  revenue_received: number | null;
  payment_link: string | null;
}

export const HEALTHCARE_LEAD_COLUMNS = [
  { key: 'name', label: 'Patient Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'whatsapp', label: 'WhatsApp', type: 'phone', required: false },
  { key: 'age', label: 'Age', type: 'number', required: false },
  { key: 'gender', label: 'Gender', type: 'select', required: false },
  { key: 'condition', label: 'Condition/Concern', type: 'text', required: false },
  { key: 'symptoms', label: 'Symptoms', type: 'textarea', required: false },
  { key: 'department', label: 'Department', type: 'select', required: false },
  { key: 'doctor_preference', label: 'Doctor Preference', type: 'text', required: false },
  { key: 'appointment_date', label: 'Appointment Date', type: 'date', required: false },
  { key: 'appointment_time', label: 'Appointment Time', type: 'time', required: false },
  { key: 'referral_source', label: 'Referral Source', type: 'text', required: false },
  { key: 'insurance_provider', label: 'Insurance Provider', type: 'text', required: false },
  { key: 'insurance_id', label: 'Insurance ID', type: 'text', required: false },
  { key: 'treatment_type', label: 'Treatment Type', type: 'text', required: false },
  { key: 'treatment_cost', label: 'Treatment Cost', type: 'currency', required: false },
  { key: 'treatment_date', label: 'Treatment Date', type: 'date', required: false },
  { key: 'follow_up_date', label: 'Follow-up Date', type: 'date', required: false },
  { key: 'status', label: 'Status', type: 'status', required: true },
];

export const HEALTHCARE_STATUSES = [
  { value: 'new_enquiry', label: 'New Enquiry', color: '#3B82F6', category: 'new' },
  { value: 'contacted', label: 'Contacted', color: '#8B5CF6', category: 'interested' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled', color: '#F59E0B', category: 'interested' },
  { value: 'consultation_done', label: 'Consultation Done', color: '#10B981', category: 'interested' },
  { value: 'treatment_planned', label: 'Treatment Planned', color: '#6366F1', category: 'interested' },
  { value: 'treatment_ongoing', label: 'Treatment Ongoing', color: '#EC4899', category: 'paid' },
  { value: 'treatment_completed', label: 'Treatment Completed', color: '#22C55E', category: 'paid' },
  { value: 'follow_up_scheduled', label: 'Follow-up Scheduled', color: '#F97316', category: 'interested' },
  { value: 'recovered', label: 'Recovered', color: '#14B8A6', category: 'paid' },
  { value: 'not_interested', label: 'Not Interested', color: '#6B7280', category: 'other' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444', category: 'other' },
];

export const HEALTHCARE_DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Dermatology',
  'Pediatrics',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Neurology',
  'Oncology',
  'Dental',
  'Physiotherapy',
];

export const HEALTHCARE_GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
