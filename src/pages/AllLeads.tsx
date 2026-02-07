import { useCompany } from '@/hooks/useCompany';
// DashboardLayout removed
import RealEstateAllLeads from '@/industries/real_estate/RealEstateAllLeads';
import GenericAllLeads from './GenericAllLeads';

export default function AllLeads() {
  const { company, loading: companyLoading } = useCompany();

  if (companyLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  // If company industry is Real Estate, render the Real Estate specific dashboard
  if ((company as any)?.industry === 'real_estate') {
    return <RealEstateAllLeads />;
  }

  // Otherwise render the generic dashboard
  return <GenericAllLeads />;
}
