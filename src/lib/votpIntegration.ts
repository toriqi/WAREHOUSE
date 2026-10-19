/**
 * VOTP & SAP External Integration Module (Adapter Pattern)
 * ----------------------------------------------------------------------------
 * IMPORTANT POLICY:
 * Do NOT claim automatic PDF parsing from VOTP URLs or automatic SAP DO/TO
 * cancellation/creation until corporate network gateway & API credentials
 * are provisioned and tested.
 */

export interface VotpUrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  referenceCode: string | null;
  error?: string;
}

export function validateVotpUrl(rawUrl: string): VotpUrlValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { isValid: false, normalizedUrl: '', referenceCode: null, error: 'Link VOTP wajib diisi.' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        normalizedUrl: trimmed,
        referenceCode: null,
        error: 'Link VOTP harus menggunakan protokol HTTP atau HTTPS.'
      };
    }
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const refCandidate = pathSegments[pathSegments.length - 1] || parsed.searchParams.get('id') || null;
    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      referenceCode: refCandidate
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      referenceCode: null,
      error: 'Format URL Link VOTP tidak valid (contoh: https://votp.company.co.id/doc/VOTP-2026-001).'
    };
  }
}
