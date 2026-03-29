import { describe, expect, it } from 'vitest';
import manifest from '../../app/manifest';
import enTranslations from '../../i18n/en.json';
import { COOKIES } from '../constants';

describe('Saveika branding', () => {
  it('uses Saveika in the web manifest', () => {
    const appManifest = manifest();

    expect(appManifest.name).toBe('Saveika - Community Mental Health Screening');
    expect(appManifest.short_name).toBe('Saveika');
  });

  it('uses Saveika in the primary English app name', () => {
    expect(enTranslations.app.name).toBe('Saveika');
  });

  it('uses the Saveika role cookie key', () => {
    expect(COOKIES.ROLE).toBe('saveika-role');
  });
});
