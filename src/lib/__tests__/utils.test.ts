import { describe, it, expect } from 'vitest';
import { getMetadataBase, normalizeRelation } from '../utils';

describe('normalizeRelation', () => {
  it('returns null for null input', () => {
    expect(normalizeRelation(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeRelation(undefined)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(normalizeRelation([])).toBeNull();
  });

  it('returns the object directly when relation is an object', () => {
    const area = { name: 'Area 1', name_ne: 'क्षेत्र १' };
    expect(normalizeRelation(area)).toEqual(area);
  });

  it('returns the first element when relation is an array with one element', () => {
    const area = { name: 'Area 1', name_ne: 'क्षेत्र १' };
    expect(normalizeRelation([area])).toEqual(area);
  });

  it('returns the first element when relation is an array with multiple elements', () => {
    const area1 = { name: 'Area 1', name_ne: 'क्षेत्र १' };
    const area2 = { name: 'Area 2', name_ne: 'क्षेत्र २' };
    expect(normalizeRelation([area1, area2])).toEqual(area1);
  });

  // Regression tests reproducing Supabase one-to-one relation shapes
  describe('Supabase relation shape handling', () => {
    it('handles area relation as object (Supabase one-to-one)', () => {
      const relation = { id: '123', name: 'Kathmandu', name_ne: 'काठमाडौं' };
      const result = normalizeRelation(relation);
      expect(result).toEqual(relation);
      expect(result?.name).toBe('Kathmandu');
    });

    it('handles area relation as array (legacy/mixed Supabase behavior)', () => {
      const relation = [{ id: '123', name: 'Kathmandu', name_ne: 'काठमाडौं' }];
      const result = normalizeRelation(relation);
      expect(result).toEqual(relation[0]);
      expect(result?.name).toBe('Kathmandu');
    });

    it('handles profile/CHW relation as object', () => {
      const relation = { id: 'user-1', full_name: 'Ram Bahadur', email: 'ram@example.com' };
      const result = normalizeRelation(relation);
      expect(result).toEqual(relation);
      expect(result?.full_name).toBe('Ram Bahadur');
    });

    it('handles profile/CHW relation as array', () => {
      const relation = [{ id: 'user-1', full_name: 'Ram Bahadur', email: 'ram@example.com' }];
      const result = normalizeRelation(relation);
      expect(result).toEqual(relation[0]);
      expect(result?.full_name).toBe('Ram Bahadur');
    });

    it('handles null relation (no linked record)', () => {
      const result = normalizeRelation(null);
      expect(result).toBeNull();
    });

    // Real-world scenario: household.areas may be null, object, or array
    it('prevents Unknown from rendering when area exists as object', () => {
      interface HouseholdWithArea {
        id: string;
        areas: { name: string; name_ne: string } | { name: string; name_ne: string }[] | null;
      }
      const household: HouseholdWithArea = {
        id: 'h1',
        areas: { name: 'Bhaktapur', name_ne: 'भक्तपुर' },
      };
      const area = normalizeRelation(household.areas);
      expect(area?.name).toBe('Bhaktapur');
    });

    it('prevents Unknown from rendering when area exists as array', () => {
      interface HouseholdWithArea {
        id: string;
        areas: { name: string; name_ne: string } | { name: string; name_ne: string }[] | null;
      }
      const household: HouseholdWithArea = {
        id: 'h1',
        areas: [{ name: 'Bhaktapur', name_ne: 'भक्तपुर' }],
      };
      const area = normalizeRelation(household.areas);
      expect(area?.name).toBe('Bhaktapur');
    });

    // Real-world scenario: profiles (CHW) relation
    it('prevents Unknown from rendering when CHW profile exists as object', () => {
      interface HouseholdWithCHW {
        id: string;
        profiles: { full_name: string } | { full_name: string }[] | null;
      }
      const household: HouseholdWithCHW = {
        id: 'h1',
        profiles: { full_name: 'Sita Thapa' },
      };
      const profile = normalizeRelation(household.profiles);
      expect(profile?.full_name).toBe('Sita Thapa');
    });

    it('prevents Unknown from rendering when CHW profile exists as array', () => {
      interface HouseholdWithCHW {
        id: string;
        profiles: { full_name: string } | { full_name: string }[] | null;
      }
      const household: HouseholdWithCHW = {
        id: 'h1',
        profiles: [{ full_name: 'Sita Thapa' }],
      };
      const profile = normalizeRelation(household.profiles);
      expect(profile?.full_name).toBe('Sita Thapa');
    });
  });
});

describe('getMetadataBase', () => {
  it('adds https when NEXT_PUBLIC_APP_URL is missing a protocol', () => {
    expect(getMetadataBase('saveika.vercel.app').toString()).toBe('https://saveika.vercel.app/');
  });

  it('falls back to localhost when the app url is missing', () => {
    expect(getMetadataBase(undefined).toString()).toBe('http://localhost:3000/');
  });
});
