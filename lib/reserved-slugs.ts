export const RESERVED_SLUGS = new Set([
  // Brand
  'loofa', 'loofas', 'loofabag', 'loofabags', 'myloofa', 'myloofabag',
  'myloofas', 'my-loofas', 'my-loofa',

  // App routes
  'api', 'q', 'auth', 'login', 'logout', 'signup', 'sign-up', 'sign-in',
  'register', 'create', 'dashboard', 'settings', 'profile', 'account',
  'home', 'app', 'terms', 'privacy', 'pricing', 'about', 'contact',
  'help', 'faq', 'support',

  // Admin / system
  'admin', 'administrator', 'root', 'system', 'staff', 'official',
  'moderator', 'mod', 'superuser',

  // Legal / abuse
  'security', 'abuse', 'legal', 'dmca', 'copyright', 'report',
  'trust', 'safety',

  // Infra / DNS
  'www', 'mail', 'email', 'noreply', 'no-reply', 'info', 'hello',
  'ping', 'health', 'status', 'robots', 'sitemap', 'favicon',
  'wellknown', 'well-known', 'cdn', 'static', 'assets',

  // Commerce
  'shop', 'store', 'checkout', 'payment', 'billing', 'order', 'orders',
  'cart', 'buy', 'purchase',

  // Deploy / env
  'prod', 'production', 'beta', 'staging', 'dev', 'development',
  'test', 'testing', 'demo', 'example', 'sample', 'sandbox',

  // Common bad values
  'null', 'undefined', 'none', 'anonymous', 'guest',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}
