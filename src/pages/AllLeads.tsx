import { useCompany } from '@/hooks/useCompany';
import RealEstateAllLeads from '@/industries/real_estate/RealEstateAllLeads';
import SaaSAllLeads from '@/industries/saas/SaaSAllLeads';
import GenericAllLeads from './GenericAllLeads';

export default function AllLeads() {
  const { company } = useCompany();

  if ((company as any)?.industry === 'saas') {
    return <SaaSAllLeads />;
  }

  if ((company as any)?.industry === 'real_estate') {
    return <RealEstateAllLeads />;
  }

  return <GenericAllLeads />;
}
