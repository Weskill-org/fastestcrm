// Industries Master Index
// Central export point for all industry configurations

// Import each industry module for dynamic loading
import * as Education from './education';
import * as RealEstate from './real_estate';
import * as Healthcare from './healthcare';
import * as Insurance from './insurance';
import * as Automotive from './automotive';
import * as Finance from './finance';
import * as Retail from './retail';
import * as Travel from './travel';
import * as SaaS from './saas';

import { IndustryType } from '@/config/industries';

// Export namespaced industry modules
export { Education, RealEstate, Healthcare, Insurance, Automotive, Finance, Retail, Travel, SaaS };

// Industry configs map for direct access
export const IndustryConfigs = {
  education: Education,
  real_estate: RealEstate,
  healthcare: Healthcare,
  insurance: Insurance,
  automotive: Automotive,
  finance: Finance,
  retail: Retail,
  travel: Travel,
  saas: SaaS,
} as const;

// Dynamic industry loader based on company industry setting
export function getIndustryConfig(industry: IndustryType) {
  switch (industry) {
    case 'education':
      return import('./education');
    case 'real_estate':
      return import('./real_estate');
    case 'healthcare':
      return import('./healthcare');
    case 'insurance':
      return import('./insurance');
    case 'automotive':
      return import('./automotive');
    case 'finance':
      return import('./finance');
    case 'retail':
      return import('./retail');
    case 'travel':
      return import('./travel');
    case 'saas':
      return import('./saas');
    default:
      return import('./education'); // Default to education
  }
}

// Get static industry config (synchronous)
export function getIndustryConfigSync(industry: IndustryType) {
  return IndustryConfigs[industry] || IndustryConfigs.education;
}
