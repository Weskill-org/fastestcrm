// SaaS & Technology Industry Index
export * from './config';
export { default as SaaSAllLeads } from './SaaSAllLeads';
export { useSaaSLeads } from './hooks/useSaaSLeads';
export { SaaSLeadsTable } from './components/SaaSLeadsTable';
export { SaaSAddLeadDialog } from './components/SaaSAddLeadDialog';
export { SaaSEditLeadDialog } from './components/SaaSEditLeadDialog';
export { SaaSLeadDetailsDialog } from './components/SaaSLeadDetailsDialog';
export { SaaSAssignLeadsDialog } from './components/SaaSAssignLeadsDialog';
export { SaaSUploadLeadsDialog } from './components/SaaSUploadLeadsDialog';

export const INDUSTRY_ID = 'saas' as const;
export const INDUSTRY_NAME = 'SaaS & Technology';
export const INDUSTRY_DESCRIPTION = 'CRM configuration for software companies, IT services, and startups';
