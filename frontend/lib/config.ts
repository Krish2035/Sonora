/**
 * Sonora Client Configuration
 * Normalizes API URL by safely stripping any trailing slashes to avoid '//api/...' 404 errors.
 */
export const getApiUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return raw.replace(/\/+$/, '');
};

export const API_URL = getApiUrl();
