import { useCompany } from '@/hooks/useCompany';
// DashboardLayout removed
import RealEstateAllLeads from '@/industries/real_estate/RealEstateAllLeads';
import GenericAllLeads from './GenericAllLeads';

export default function AllLeads() {
  const { company } = useCompany();

  // If company industry is Real Estate, render the Real Estate specific dashboard
  // While loading, company is null → renders GenericAllLeads which shows skeletons
  if ((company as any)?.industry === 'real_estate') {
    return <RealEstateAllLeads />;
  }

  return <GenericAllLeads />;
}
