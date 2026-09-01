import { BrandType } from '../../db/schema';

export interface BrandConfig {
  id: BrandType;
  displayName: string;
  shortName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  badgeText: string;
  phoneNumbers: string[];
  email: string;
  addresses: string[];
  defaultWarranty: string;
  defaultPaymentMode: string;
  defaultDisclaimer: string;
}

export const BRAND_CONFIGS: Record<BrandType, BrandConfig> = {
  tasnim_computers: {
    id: 'tasnim_computers',
    displayName: 'Tasnim Computers',
    shortName: 'Tasnim',
    tagline: 'Deals in All Kinds of New & Used Desktop & Laptops',
    primaryColor: '#DC2626', // Brand red accent
    secondaryColor: '#1F2937', // Dark charcoal
    accentColor: '#0284C7', // Sky blue
    badgeText: 'Sales & Service',
    phoneNumbers: ['0345-5982628', '0345-5551559', '051-4265300', '0301-5177866'],
    email: 'tcomwah@gmail.com',
    addresses: [
      'Branch 1: Anwar Chowk, Wah Cantt. 0345-5982628    051-4265300',
      'Branch 2: Bilal Market NawabAbad, Near Barrier 2 WahCantt. 0301-5177866 tcomwah@gmail.com',
    ],
    defaultWarranty: 'ONE WEEK CHECK WARRENTY',
    defaultPaymentMode: 'CASH',
    defaultDisclaimer: 'THIS IS A SYSTEM GENERATED INVOICE AND DOES NOT NEED ANY SIGNATURE',
  },
  farhan_computers: {
    id: 'farhan_computers',
    displayName: 'Farhan Computers',
    shortName: 'Farhan PC',
    tagline: 'Deals in All Kinds of New & Used Desktop & Laptops',
    primaryColor: '#EF4444',
    secondaryColor: '#1E3A8A',
    accentColor: '#3B82F6',
    badgeText: 'Sales & Service',
    phoneNumbers: ['0345-5982628', '0345-5551559', '051-4265300'],
    email: 'farhanqt125@gmail.com',
    addresses: ['Anwar Chowk, Wah Cantt.'],
    defaultWarranty: 'ONE WEEK CHECK WARRENTY',
    defaultPaymentMode: 'CASH',
    defaultDisclaimer: 'THIS IS A SYSTEM GENERATED INVOICE AND DOES NOT NEED ANY SIGNATURE',
  },
  farhan_enterprises: {
    id: 'farhan_enterprises',
    displayName: 'Farhan Enterprises',
    shortName: 'Farhan Ent',
    tagline: 'DEALS IN ALL KINDS OF IT SOLUTIONS.',
    primaryColor: '#F97316', // Orange
    secondaryColor: '#374151', // Charcoal
    accentColor: '#EA580C',
    badgeText: 'Enterprise IT',
    phoneNumbers: ['0345-5551559', '051-4265300'],
    email: 'thefarhanenterprises@gmail.com',
    addresses: ['Near Tower, Anwar Chowk Wah Cantt'],
    defaultWarranty: '1 YEAR OFFICIAL / CHECK WARRANTY',
    defaultPaymentMode: 'CASH',
    defaultDisclaimer: 'THIS IS A SYSTEM GENERATED INVOICE AND DOES NOT NEED ANY SIGNATURE',
  },
};
