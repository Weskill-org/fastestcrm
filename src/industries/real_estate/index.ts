// Real Estate Industry - Exports
export * from './config';
export { default as RealEstateAllLeads } from './RealEstateAllLeads';
export { default as ManageLeadProfiling } from './ManageLeadProfiling';
export * from './hooks/useRealEstateLeads';
export * from './components/RealEstateLeadsTable';
export * from './components/RealEstateAddLeadDialog';
export * from './components/RealEstateEditLeadDialog';
export * from './components/RealEstateLeadDetailsDialog';
export * from './components/RealEstateAssignLeadsDialog';
export * from './components/SiteVisitDateTimeDialog';
export * from './components/SiteVisitCameraDialog';

// Industry identifier
export const INDUSTRY_ID = 'real_estate' as const;
export const INDUSTRY_NAME = 'Real Estate';
export const INDUSTRY_DESCRIPTION = 'CRM configuration for property dealers, builders, and real estate brokers';
