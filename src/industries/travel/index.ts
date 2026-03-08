// Travel & Hospitality Industry Index
export * from './config';
export { default as TravelAllLeads } from './TravelAllLeads';
export { useTravelLeads } from './hooks/useTravelLeads';
export { TravelLeadsTable } from './components/TravelLeadsTable';
export { TravelAddLeadDialog } from './components/TravelAddLeadDialog';
export { TravelEditLeadDialog } from './components/TravelEditLeadDialog';
export { TravelLeadDetailsDialog } from './components/TravelLeadDetailsDialog';
export { TravelAssignLeadsDialog } from './components/TravelAssignLeadsDialog';
export { TravelUploadLeadsDialog } from './components/TravelUploadLeadsDialog';

export const INDUSTRY_ID = 'travel' as const;
export const INDUSTRY_NAME = 'Travel & Hospitality';
export const INDUSTRY_DESCRIPTION = 'CRM configuration for travel agents, hotels, and tour operators';
