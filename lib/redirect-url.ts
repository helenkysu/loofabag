// Custom QR redirect URLs are restricted to known platforms to prevent
// loofas from being used to link to inappropriate or unmoderated content.
export const ALLOWED_REDIRECT_DOMAINS = [
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'tiktok.com',
  'snapchat.com',
  'threads.net',
  'youtube.com',
  'youtu.be',
  'twitch.tv',
  'spotify.com',
  'soundcloud.com',
  'linktr.ee',
  'beacons.ai',
  'venmo.com',
  'paypal.me',
  'cash.app',
  'calendly.com',
];

export function normalizeRedirectUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isAllowedRedirectUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(normalizeRedirectUrl(input));
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  return ALLOWED_REDIRECT_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}
