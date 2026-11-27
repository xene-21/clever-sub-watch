/**
 * merchantFallback.ts
 * Static merchant dictionary, non-subscription blocklist patterns, and
 * descriptor helpers shared by the recurring engine and Gmail scanner when
 * Apache Solr is offline or a descriptor is unknown.
 */

// Mirrors the curated Solr merchant seed for offline fallback.
export const MERCHANT_CATEGORIES: Record<string, string> = {
  // Streaming
  netflix: 'Streaming', hulu: 'Streaming', disney: 'Streaming', 'disney+': 'Streaming',
  'hbo max': 'Streaming', max: 'Streaming', paramount: 'Streaming', 'paramount+': 'Streaming',
  peacock: 'Streaming', 'apple tv': 'Streaming', 'apple tv+': 'Streaming',
  'amazon prime': 'Streaming', 'prime video': 'Streaming',
  youtube: 'Streaming', 'youtube premium': 'Streaming', twitch: 'Streaming',
  crunchyroll: 'Streaming', 'discovery+': 'Streaming', dazn: 'Streaming',
  mubi: 'Streaming', 'now tv': 'Streaming', nowtv: 'Streaming',
  'sky go': 'Streaming', sky: 'Streaming', bbc: 'Streaming', 'bbc iplayer': 'Streaming',
  britbox: 'Streaming', shudder: 'Streaming',
  plex: 'Streaming', showmax: 'Streaming', dstv: 'Streaming', gotv: 'Streaming',
  multichoice: 'Streaming',
  // Music
  spotify: 'Music', 'apple music': 'Music', 'amazon music': 'Music',
  tidal: 'Music', deezer: 'Music', soundcloud: 'Music', pandora: 'Music',
  // Gaming
  xbox: 'Gaming', 'xbox game pass': 'Gaming', playstation: 'Gaming',
  'playstation plus': 'Gaming', 'ps plus': 'Gaming', nintendo: 'Gaming',
  'ea play': 'Gaming', steam: 'Gaming', 'epic games': 'Gaming',
  // Productivity
  apple: 'Productivity',
  microsoft: 'Productivity', 'microsoft 365': 'Productivity', 'office 365': 'Productivity',
  adobe: 'Productivity', 'creative cloud': 'Productivity', figma: 'Productivity',
  notion: 'Productivity', slack: 'Productivity', zoom: 'Productivity',
  dropbox: 'Productivity', github: 'Productivity', grammarly: 'Productivity',
  evernote: 'Productivity', todoist: 'Productivity', trello: 'Productivity',
  asana: 'Productivity', monday: 'Productivity', canva: 'Productivity',
  webflow: 'Productivity', squarespace: 'Productivity', wix: 'Productivity',
  wordpress: 'Productivity', shopify: 'Productivity', intercom: 'Productivity',
  hubspot: 'Productivity', mailchimp: 'Productivity',
  zapier: 'Productivity', 'google workspace': 'Productivity', linear: 'Productivity',
  atlassian: 'Productivity', jira: 'Productivity', jetbrains: 'Productivity', starlink: 'Productivity',
  // AI Tools
  'github copilot': 'AI Tools', chatgpt: 'AI Tools', openai: 'AI Tools',
  'claude ai': 'AI Tools', claude: 'AI Tools', anthropic: 'AI Tools',
  gemini: 'AI Tools', 'google gemini': 'AI Tools',
  perplexity: 'AI Tools', midjourney: 'AI Tools', 'hugging face': 'AI Tools',
  elevenlabs: 'AI Tools', runway: 'AI Tools', cursor: 'AI Tools', replicate: 'AI Tools',
  // Cloud Storage
  'google one': 'Cloud Storage', icloud: 'Cloud Storage', aws: 'Cloud Storage',
  digitalocean: 'Cloud Storage', vercel: 'Cloud Storage', heroku: 'Cloud Storage',
  // Security
  '1password': 'Security', lastpass: 'Security', bitwarden: 'Security',
  nordvpn: 'Security', expressvpn: 'Security', surfshark: 'Security',
  dashlane: 'Security', norton: 'Security', malwarebytes: 'Security',
  // Finance
  quickbooks: 'Finance', xero: 'Finance', wise: 'Finance',
  // Fitness
  peloton: 'Fitness', strava: 'Fitness', headspace: 'Fitness', calm: 'Fitness',
  myfitnesspal: 'Fitness', whoop: 'Fitness', puregym: 'Fitness', 'pure gym': 'Fitness',
  // Food & Drink
  hellofresh: 'Food & Drink', deliveroo: 'Food & Drink', 'uber eats': 'Food & Drink',
  doordash: 'Food & Drink', 'just eat': 'Food & Drink',
  // News & Reading
  'new york times': 'News & Reading', medium: 'News & Reading', substack: 'News & Reading',
  kindle: 'News & Reading', audible: 'News & Reading',
  // Education
  duolingo: 'Education', coursera: 'Education', skillshare: 'Education',
  udemy: 'Education', linkedin: 'Education', masterclass: 'Education',
  // Transport
  'uber one': 'Transport', 'lyft pink': 'Transport',
  // Telecom
  mtn: 'Telecom', airtel: 'Telecom', glo: 'Telecom', 'at&t': 'Telecom', verizon: 'Telecom',
  't-mobile': 'Telecom', o2: 'Telecom', vodafone: 'Telecom', ee: 'Telecom', three: 'Telecom',
  'mint mobile': 'Telecom',
  // Shopping
  amazon: 'Shopping', 'walmart+': 'Shopping', instacart: 'Shopping', chewy: 'Shopping',
  // Social & Dating
  tinder: 'Social & Dating', bumble: 'Social & Dating', hinge: 'Social & Dating', patreon: 'Social & Dating',
};

export const NON_SUBSCRIPTION_PATTERNS: RegExp[] = [
  /\btransfer\b/i, /\btrf\b/i, /\bsend money\b/i, /\bwire transfer\b/i,
  /\bzelle\b/i, /\bcash app\b/i, /\bvenmo\b/i,
  /\brepayment\b/i, /\bloan repay/i, /\bmypay\b/i,
  /\bdirect debit\b/i, /\bstorecrd\b/i, /\bcredit card payment\b/i, /\bcard payment\b/i,
  /\buber\s*\*?(trip|x|pool|xl|black)\b/i,
  /\blyft\s*\*?(airport|standard|shared|xl|lux|black)\b/i,
  /\bbolt\s*(trip|food)\b/i,
  /\bkroger\b/i, /\bwhole foods\b/i, /\bsafeway\b/i, /\bpublix\b/i,
  /\btrader joe/i, /\baldi\b/i, /\bwegmans\b/i, /\bfood lion\b/i, /\btesco\b/i,
  /\bsainsbury/i, /\basda\b/i, /\bmorrisons?\b/i, /\bwaitrose\b/i,
  /\bmarks & spencer\b/i, /\bm&s food\b/i, /\blidl\b/i, /\bthorntons?\b/i,
  /\bholland & barrett\b/i, /\bco-?op\b/i,
  /\bshell\b/i, /\bbp\b/i, /\besso\b/i, /\btexaco\b/i,
  /\bexxon\b/i, /\bmobil\b/i, /\bchevron\b/i,
  /\batm\b/i, /\bcash withdrawal\b/i, /\bcashback\b/i,
  /\bpayment to\b/i, /\bpay to\b/i, /\bbill pay(ment)?\b/i, /\baccount payment\b/i,
];

export function stripGatewayPrefix(name: string): string {
  return name.replace(/^(paystack|flw|flutterwave|pos|web|pos\/web|nip|trf)\s*[*:\/ -]\s*/i, '').trim();
}

export function normalizeMerchant(name: string): string {
  let stripped = stripGatewayPrefix(name);
  const aggMatch = stripped.match(/^(paypal|sq|tst|sp|stripe|google|razorpay)\s*\*\s*(.+)$/i);
  if (aggMatch && /[a-zA-Z]{2,}/.test(aggMatch[2])) {
    stripped = aggMatch[2];
  }
  return stripped
    .toLowerCase()
    .replace(/\*.*$/, '')
    .replace(/\.(com|net|org|io)$/, '')
    .replace(/\b\d{3,}\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSimilarMerchant(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.startsWith('solr:') || b.startsWith('solr:')) {
    return a === b;
  }
  const na = a.replace(/^norm:/, '');
  const nb = b.replace(/^norm:/, '');
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.startsWith(nb) || nb.startsWith(na)) return true;
  return false;
}

export function staticResolveMerchantCategory(merchantName: string, rawCategory: string | null): string {
  const stripped = stripGatewayPrefix(merchantName);
  const normalized = stripped.toLowerCase()
    .replace(/\*.*$/, '')
    .replace(/\.(com|net|org|io)$/, '')
    .replace(/[^a-z0-9 '&-]/g, '')
    .trim();

  if (MERCHANT_CATEGORIES[normalized]) return MERCHANT_CATEGORIES[normalized];
  for (const key of Object.keys(MERCHANT_CATEGORIES)) {
    if (normalized.includes(key) || (normalized.length >= 4 && key.includes(normalized))) {
      return MERCHANT_CATEGORIES[key];
    }
  }
  if (rawCategory) {
    return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
  }
  return 'Other';
}

export function staticIsNonSubscription(rawName: string): boolean {
  return NON_SUBSCRIPTION_PATTERNS.some(p => p.test(rawName));
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}
