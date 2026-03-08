// Healthcare Industry Index
export * from './config';
export { default as HealthcareAllLeads } from './HealthcareAllLeads';
export { useHealthcareLeads } from './hooks/useHealthcareLeads';
export { HealthcareLeadsTable } from './components/HealthcareLeadsTable';
export { HealthcareAddLeadDialog } from './components/HealthcareAddLeadDialog';
export { HealthcareEditLeadDialog } from './components/HealthcareEditLeadDialog';
export { HealthcareLeadDetailsDialog } from './components/HealthcareLeadDetailsDialog';
export { HealthcareAssignLeadsDialog } from './components/HealthcareAssignLeadsDialog';
export { HealthcareUploadLeadsDialog } from './components/HealthcareUploadLeadsDialog';

export const INDUSTRY_ID = 'healthcare' as const;
export const INDUSTRY_NAME = 'Healthcare';
export const INDUSTRY_DESCRIPTION = 'CRM configuration for hospitals, clinics, and diagnostic centers';
