// Insurance Industry Index
export * from './config';

export const INDUSTRY_ID = 'insurance' as const;
export const INDUSTRY_NAME = 'Insurance';
export const INDUSTRY_DESCRIPTION = 'CRM configuration for insurance agents, brokers, and companies';

export { default as InsuranceAllLeads } from './InsuranceAllLeads';
export { default as InsuranceLeadProfiling } from './InsuranceLeadProfiling';
export { default as ManageInsurancePlans } from './ManageInsurancePlans';
export { useInsuranceLeads } from './hooks/useInsuranceLeads';
