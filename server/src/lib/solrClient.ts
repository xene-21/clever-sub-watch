/**
 * solrClient.ts
 * Typed HTTP client for Apache Solr 10.x (supports both SolrCloud and Standalone).
 * Powers fuzzy merchant canonicalisation, blocklist filtering, category inference
 * (similarity / MoreLikeThis), and cross-sync transaction grouping.
 */

const MERCHANTS_CORE = 'merchants';
const TRANSACTIONS_CORE = 'transactions';

function getSolrBase(): string {
  return (process.env.SOLR_URL ?? 'http://localhost:8983/solr').replace(/\/+$/, '');
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MerchantDoc {
  id: string;                     // canonical key e.g. "netflix"
  canonical_name: string;         // display name e.g. "Netflix"
  aliases: string[];              // all known descriptor variants
  category: string;               // e.g. "Streaming" | "BLOCKLIST"
  default_cycle?: string;         // e.g. "monthly"
  is_non_subscription?: boolean;  // true = blocklist entry
  is_category_hint?: boolean;     // true = keyword-only category hint (not a merchant identity)
  source?: 'seed' | 'learned';
}

export interface SolrMatchResult {
  id: string;
  canonical_name: string;
  category: string;
  default_cycle?: string;
  is_non_subscription: boolean;
  score: number;
}

export interface SolrTransactionDoc {
  id: string;                     // "${user_id}::${transaction_id}"
  user_id: string;
  transaction_id: string;
  connection_id?: string;
  mono_connection_id?: string;
  raw_name: string;
  merchant_raw: string;
  merchant_key: string;           // e.g. "solr:netflix" or "norm:local gym"
  canonical_name: string;
  category: string;
  amount: number;
  tx_date: string;                // ISO timestamp YYYY-MM-DDT00:00:00Z
  is_non_subscription: boolean;
}

export interface SolrTransactionGroup {
  merchantKey: string;
  docs: SolrTransactionDoc[];
}

interface SolrQueryResponse {
  response: {
    numFound: number;
    docs: Array<Record<string, unknown>>;
  };
}

interface SolrGroupedResponse {
  grouped?: {
    merchant_key?: {
      matches: number;
      groups: Array<{
        groupValue: string | null;
        doclist: {
          numFound: number;
          docs: Array<Record<string, unknown>>;
        };
      }>;
    };
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function unwrapScalar<T>(val: unknown): T | undefined {
  if (Array.isArray(val)) return val[0] as T | undefined;
  return val as T | undefined;
}

async function solrGet(path: string, params: Record<string, string> = {}, timeoutMs = 5000): Promise<unknown> {
  const url = new URL(`${getSolrBase()}/${path}`);
  url.searchParams.set('wt', 'json');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Solr GET ${path} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function solrPost(path: string, body: unknown, timeoutMs = 10000): Promise<unknown> {
  const url = `${getSolrBase()}/${path}?wt=json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Solr POST ${path} failed (${res.status}): ${errText.slice(0, 300)}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────

export async function isSolrServerReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${getSolrBase()}/admin/info/system?wt=json`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function isSolrAvailable(): Promise<boolean> {
  if (process.env.SOLR_URL === 'disabled') return false;
  try {
    const [mRes, tRes] = await Promise.all([
      fetch(`${getSolrBase()}/${MERCHANTS_CORE}/admin/ping?wt=json`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${getSolrBase()}/${TRANSACTIONS_CORE}/admin/ping?wt=json`, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (!mRes.ok || !tRes.ok) return false;
    const mJson = (await mRes.json()) as { status?: string };
    const tJson = (await tRes.json()) as { status?: string };
    return mJson.status === 'OK' && tJson.status === 'OK';
  } catch {
    return false;
  }
}

const SOLR_CHECK_TTL_MS = 30_000;
let _solrCachedAvailable = false;
let _solrCheckedAt = 0;

/**
 * Cached Solr availability check (30s TTL) so transient startups don't lock
 * the server into offline mode while avoiding repeated pings in tight loops.
 */
export async function isSolrOnline(context = 'Solr'): Promise<boolean> {
  const now = Date.now();
  if (now - _solrCheckedAt < SOLR_CHECK_TTL_MS) {
    return _solrCachedAvailable;
  }
  _solrCachedAvailable = await isSolrAvailable();
  _solrCheckedAt = now;
  if (!_solrCachedAvailable) {
    console.warn(`[${context}] Solr is offline — falling back to static dictionaries & in-memory logic.`);
  }
  return _solrCachedAvailable;
}

/**
 * Reset the cached Solr availability flag (useful in tests).
 */
export function resetSolrAvailabilityCache(): void {
  _solrCheckedAt = 0;
  _solrCachedAvailable = false;
}

// ─────────────────────────────────────────────────────────────
// Collection & Schema Bootstrap (idempotent)
// ─────────────────────────────────────────────────────────────

async function getSolrMode(): Promise<'solrcloud' | 'standalone'> {
  const info = (await solrGet('admin/info/system')) as { mode?: string };
  return info.mode === 'solrcloud' ? 'solrcloud' : 'standalone';
}

async function ensureCollectionExists(name: string, mode: 'solrcloud' | 'standalone'): Promise<void> {
  if (mode === 'solrcloud') {
    const list = (await solrGet('admin/collections', { action: 'LIST' })) as { collections?: string[] };
    if (list.collections?.includes(name)) return;
    await solrGet('admin/collections', {
      action: 'CREATE',
      name,
      numShards: '1',
      replicationFactor: '1',
    }, 30000);
  } else {
    const status = (await solrGet('admin/cores', { action: 'STATUS', core: name })) as {
      status?: Record<string, unknown>;
    };
    if (status.status && Object.keys(status.status[name] as object ?? {}).length > 0) return;
    await solrGet('admin/cores', {
      action: 'CREATE',
      name,
      configSet: '_default',
    }, 30000);
  }
}

async function applySchemaIdempotently(
  core: string,
  fieldTypes: Array<Record<string, unknown>>,
  fields: Array<Record<string, unknown>>,
  copyFields: Array<{ source: string; dest: string }>
): Promise<void> {
  const current = (await solrGet(`${core}/schema`)) as {
    schema: {
      fieldTypes?: Array<{ name: string }>;
      fields?: Array<{ name: string }>;
      copyFields?: Array<{ source: string; dest: string }>;
    };
  };

  const existingTypes = new Set((current.schema.fieldTypes ?? []).map(ft => ft.name));
  const existingFields = new Set((current.schema.fields ?? []).map(f => f.name));
  const existingCopy = new Set(
    (current.schema.copyFields ?? []).map(cf => `${cf.source}->${cf.dest}`)
  );

  const payload: Record<string, unknown> = {};

  const missingTypes = fieldTypes.filter(ft => !existingTypes.has(ft.name as string));
  if (missingTypes.length > 0) payload['add-field-type'] = missingTypes;

  // Replace field if it was auto-created earlier with wrong type, or add if missing
  const toAddFields = fields.filter(f => !existingFields.has(f.name as string));
  const toReplaceFields = fields.filter(f => existingFields.has(f.name as string));
  if (toAddFields.length > 0) payload['add-field'] = toAddFields;
  if (toReplaceFields.length > 0) payload['replace-field'] = toReplaceFields;

  const missingCopy = copyFields.filter(cf => !existingCopy.has(`${cf.source}->${cf.dest}`));
  if (missingCopy.length > 0) payload['add-copy-field'] = missingCopy;

  if (Object.keys(payload).length > 0) {
    await solrPost(`${core}/schema`, payload, 15000);
  }

  // Disable schemaless auto-field creation so types remain strict
  await solrPost(`${core}/config`, {
    'set-user-property': { 'update.autoCreateFields': 'false' },
  }).catch(() => {});
}

export async function ensureCollectionsAndSchemas(): Promise<void> {
  const mode = await getSolrMode();

  await ensureCollectionExists(MERCHANTS_CORE, mode);
  await ensureCollectionExists(TRANSACTIONS_CORE, mode);

  const textMerchantType = {
    name: 'text_merchant',
    class: 'solr.TextField',
    positionIncrementGap: '100',
    indexAnalyzer: {
      tokenizer: { name: 'whitespace' },
      filters: [
        {
          name: 'wordDelimiterGraph',
          generateWordParts: '1',
          generateNumberParts: '1',
          catenateWords: '1',
          catenateNumbers: '0',
          splitOnCaseChange: '1',
          preserveOriginal: '1',
        },
        { name: 'asciiFolding' },
        { name: 'lowercase' },
        { name: 'flattenGraph' },
      ],
    },
    queryAnalyzer: {
      tokenizer: { name: 'whitespace' },
      filters: [
        {
          name: 'wordDelimiterGraph',
          generateWordParts: '1',
          generateNumberParts: '1',
          catenateWords: '1',
          catenateNumbers: '0',
          splitOnCaseChange: '1',
          preserveOriginal: '1',
        },
        { name: 'asciiFolding' },
        { name: 'lowercase' },
      ],
    },
  };

  const textMerchantEdgeType = {
    name: 'text_merchant_edge',
    class: 'solr.TextField',
    positionIncrementGap: '100',
    indexAnalyzer: {
      tokenizer: { name: 'standard' },
      filters: [
        { name: 'asciiFolding' },
        { name: 'lowercase' },
        { name: 'edgeNGram', minGramSize: '3', maxGramSize: '15' },
      ],
    },
    queryAnalyzer: {
      tokenizer: { name: 'standard' },
      filters: [
        { name: 'asciiFolding' },
        { name: 'lowercase' },
      ],
    },
  };

  await applySchemaIdempotently(
    MERCHANTS_CORE,
    [textMerchantType, textMerchantEdgeType],
    [
      { name: 'canonical_name', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'canonical_text', type: 'text_merchant', stored: false, indexed: true, multiValued: false },
      { name: 'aliases', type: 'text_merchant', stored: true, indexed: true, multiValued: true },
      { name: 'aliases_exact', type: 'lowercase', stored: false, indexed: true, multiValued: true },
      { name: 'aliases_ngram', type: 'text_merchant_edge', stored: false, indexed: true, multiValued: true },
      { name: 'category', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'default_cycle', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'is_non_subscription', type: 'boolean', stored: true, indexed: true, multiValued: false },
      { name: 'is_category_hint', type: 'boolean', stored: true, indexed: true, multiValued: false },
      { name: 'source', type: 'string', stored: true, indexed: true, multiValued: false },
    ],
    [
      { source: 'canonical_name', dest: 'canonical_text' },
      { source: 'aliases', dest: 'aliases_exact' },
      { source: 'aliases', dest: 'aliases_ngram' },
    ]
  );

  await applySchemaIdempotently(
    TRANSACTIONS_CORE,
    [textMerchantType],
    [
      { name: 'user_id', type: 'string', stored: true, indexed: true, docValues: true, multiValued: false },
      { name: 'transaction_id', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'connection_id', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'mono_connection_id', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'raw_name', type: 'text_merchant', stored: true, indexed: true, multiValued: false },
      { name: 'merchant_raw', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'merchant_key', type: 'string', stored: true, indexed: true, docValues: true, multiValued: false },
      { name: 'canonical_name', type: 'string', stored: true, indexed: true, multiValued: false },
      { name: 'category', type: 'string', stored: true, indexed: true, docValues: true, multiValued: false },
      { name: 'amount', type: 'pdouble', stored: true, indexed: true, docValues: true, multiValued: false },
      { name: 'tx_date', type: 'pdate', stored: true, indexed: true, docValues: true, multiValued: false },
      { name: 'is_non_subscription', type: 'boolean', stored: true, indexed: true, multiValued: false },
    ],
    []
  );
}

// ─────────────────────────────────────────────────────────────
// Descriptor Cleaning & Query Construction
// ─────────────────────────────────────────────────────────────

const QUERY_NOISE_WORDS = new Set([
  'pos', 'debit', 'card', 'purchase', 'recurring', 'autopay', 'auto',
  'inc', 'llc', 'ltd', 'corp', 'plc', 'gmbh', 'pty', 'limited',
  'com', 'net', 'org', 'io', 'co', 'uk', 'us', 'usa', 'ng', 'ca', 'ny', 'tx', 'sf',
  'helppay', 'www', 'http', 'https',
]);

// Generic words that only carry brand identity when part of an exact multi-word phrase
const MODIFIER_WORDS = new Set([
  'pro', 'plus', 'premium', 'plan', 'pass', 'one', 'go', 'max', 'live', 'tv',
  'ai', 'cloud', 'gym', 'fitness', 'club', 'group', 'store', 'stores',
  'digital', 'online', 'service', 'services', 'bill', 'payment', 'pay',
  'to', 'the', 'for', 'and', 'of', 'in', 'by', 'at', 'with',
  'media', 'network', 'interactive', 'labs', 'technologies', 'systems',
  'mobile', 'data', 'music', 'video', 'news', 'times', 'direct', 'basic',
  'unlimited', 'super', 'express', 'membership', 'subscription', 'account',
]);

/**
 * Clean a raw bank descriptor for querying Solr without discarding
 * merchant names that follow gateway/aggregator prefixes (e.g. "PAYPAL *NETFLIX").
 */
export function cleanDescriptorForQuery(raw: string): string {
  let s = raw.trim();
  // Strip payment gateway prefixes (Paystack, Flutterwave, POS, NIP, TRF)
  s = s.replace(/^(paystack|flw|flutterwave|pos\/web|pos|web|nip|trf|ach)\s*[*:\/\- ]\s*/i, '');
  // Unwrap payment aggregators like "PAYPAL *NETFLIX", "SQ *BLUE BOTTLE", "GOOGLE *YouTube"
  const aggMatch = s.match(/^(paypal|sq|tst|sp|stripe|google|razorpay)\s*\*\s*(.+)$/i);
  if (aggMatch && /[a-zA-Z]{2,}/.test(aggMatch[2])) {
    s = aggMatch[2];
  }

  s = s
    .replace(/g\.co\/helppay#?/gi, ' ')
    .replace(/\b\d+[-/]\d+[-/]\d+\b/g, ' ') // phone numbers like 800-555-0199
    .replace(/\b\d{3,}\b/g, ' ')           // store/reference numbers
    .replace(/\.(com|net|org|io|co\.uk|ng)\b/gi, ' ')
    .replace(/[*\/|_#]+/g, ' ')             // split separators into spaces (keeps UBER *TRIP -> UBER TRIP)
    .replace(/[^a-zA-Z0-9 '&+\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return s;
}

function tokenizeClean(clean: string): string[] {
  return clean
    .split(/\s+/)
    .map(t => t.replace(/^[^a-z0-9+]+|[^a-z0-9+]+$/g, ''))
    .filter(t => t.length >= 2 && !QUERY_NOISE_WORDS.has(t));
}

function buildShingles(tokens: string[], maxN = 3): string[] {
  const shingles: string[] = [];
  for (let n = 2; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      shingles.push(tokens.slice(i, i + n).join(' '));
    }
  }
  return shingles;
}

function escapeSolr(s: string): string {
  return s.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1');
}

// ─────────────────────────────────────────────────────────────
// Merchant Lookup (Canonicalisation + Blocklist Check)
// ─────────────────────────────────────────────────────────────

export async function lookupMerchant(
  rawDescriptor: string,
  merchantName?: string | null
): Promise<SolrMatchResult | null> {
  const cleanRaw = cleanDescriptorForQuery(rawDescriptor);
  const cleanMerch = merchantName ? cleanDescriptorForQuery(merchantName) : '';

  const rawTokens = tokenizeClean(cleanRaw);
  const merchTokens = cleanMerch ? tokenizeClean(cleanMerch) : [];
  const allTokens = Array.from(new Set([...rawTokens, ...merchTokens]));
  const brandTokens = allTokens.filter(t => !MODIFIER_WORDS.has(t));
  const phrases = Array.from(
    new Set([
      ...(cleanRaw ? [cleanRaw] : []),
      ...(cleanMerch ? [cleanMerch] : []),
      ...buildShingles(rawTokens),
      ...buildShingles(merchTokens),
    ])
  );

  if (brandTokens.length === 0 && phrases.length === 0) return null;

  const clauses: string[] = [];

  // 1. Exact alias & multi-word shingle matches (highest confidence, handles "uber trip" vs "uber one")
  for (const phrase of phrases) {
    const escP = escapeSolr(phrase);
    const boost = phrase.includes(' ') ? 30 : 22;
    clauses.push(`aliases_exact:"${escP}"^${boost}`);
    clauses.push(`aliases:"${escP}"^${Math.round(boost * 0.6)}`);
    clauses.push(`canonical_text:"${escP}"^${Math.round(boost * 0.5)}`);
  }

  // 2. Brand-bearing token matches (excludes generic modifier words like "pro", "gym", "payment")
  for (const token of brandTokens) {
    const escT = escapeSolr(token);
    clauses.push(`aliases_exact:"${escT}"^18`);
    clauses.push(`aliases:${escT}^6`);
    clauses.push(`canonical_text:${escT}^5`);
    // Fuzzy ~1 and EdgeNGram only on tokens >= 5 chars to avoid false positives on short words
    if (token.length >= 5) {
      clauses.push(`aliases:${escT}~1^2.5`);
      clauses.push(`canonical_text:${escT}~1^2`);
      clauses.push(`aliases_ngram:${escT}^0.5`);
    }
  }

  if (clauses.length === 0) return null;

  try {
    const result = (await solrGet(`${MERCHANTS_CORE}/select`, {
      q: clauses.join(' OR '),
      fq: '-is_category_hint:true',
      fl: 'id,canonical_name,category,default_cycle,is_non_subscription,score',
      rows: '3',
    })) as SolrQueryResponse;

    const doc = result.response.docs[0];
    if (!doc) return null;

    const score = (doc.score as number) ?? 0;
    // Require strong relevance so unknown local shops don't false-match
    if (score < 5.0) return null;

    return {
      id: doc.id as string,
      canonical_name: unwrapScalar<string>(doc.canonical_name) ?? (doc.id as string),
      category: unwrapScalar<string>(doc.category) ?? 'Other',
      default_cycle: unwrapScalar<string>(doc.default_cycle),
      is_non_subscription: unwrapScalar<boolean>(doc.is_non_subscription) === true,
      score,
    };
  } catch (err) {
    console.warn('[Solr] lookupMerchant failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Category Inference for Unknown Merchants (Similarity / MLT)
// ─────────────────────────────────────────────────────────────

export async function inferCategoryViaSolr(
  rawDescriptor: string,
  userId?: string
): Promise<string | null> {
  const clean = cleanDescriptorForQuery(rawDescriptor);
  const tokens = tokenizeClean(clean);
  if (tokens.length === 0) return null;

  const termQuery = tokens
    .map(t => {
      const esc = escapeSolr(t);
      return t.length >= 5 ? `(aliases:${esc}^4 OR aliases:${esc}~1^2 OR canonical_text:${esc}^3)` : `(aliases:${esc}^4 OR canonical_text:${esc}^3)`;
    })
    .join(' OR ');

  try {
    // 1. Check merchant + category-hint corpus (excluding blocklist)
    const hintRes = (await solrGet(`${MERCHANTS_CORE}/select`, {
      q: termQuery,
      fq: '-is_non_subscription:true',
      fl: 'category,score',
      rows: '1',
    })) as SolrQueryResponse;

    const bestHint = hintRes.response.docs[0];
    if (bestHint && ((bestHint.score as number) ?? 0) >= 2.0) {
      const cat = unwrapScalar<string>(bestHint.category);
      if (cat && cat !== 'BLOCKLIST' && cat !== 'Other') return cat;
    }

    // 2. Check previously categorized user transactions (corpus similarity)
    if (userId) {
      const txTerms = tokens.map(t => `raw_name:${escapeSolr(t)}^3`).join(' OR ');
      const txRes = (await solrGet(`${TRANSACTIONS_CORE}/select`, {
        q: txTerms,
        fq: `user_id:"${escapeSolr(userId)}" AND -category:Other AND is_non_subscription:false`,
        fl: 'category,score',
        rows: '1',
      })) as SolrQueryResponse;

      const bestTx = txRes.response.docs[0];
      if (bestTx && ((bestTx.score as number) ?? 0) >= 1.5) {
        const cat = unwrapScalar<string>(bestTx.category);
        if (cat && cat !== 'Other') return cat;
      }
    }
  } catch (err) {
    console.warn('[Solr] inferCategoryViaSolr failed:', err);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Transaction Indexing & Solr Result Grouping (Cross-Sync History)
// ─────────────────────────────────────────────────────────────

export async function indexTransactions(docs: SolrTransactionDoc[]): Promise<void> {
  if (docs.length === 0) return;
  await solrPost(`${TRANSACTIONS_CORE}/update/json/docs`, docs, 15000);
  await solrPost(`${TRANSACTIONS_CORE}/update`, { commit: {} }, 10000);
}

export async function getUserTransactionsGrouped(userId: string): Promise<SolrTransactionGroup[]> {
  const res = (await solrGet(`${TRANSACTIONS_CORE}/select`, {
    q: `user_id:"${escapeSolr(userId)}"`,
    fq: 'is_non_subscription:false',
    group: 'true',
    'group.field': 'merchant_key',
    'group.limit': '100',
    'group.sort': 'tx_date asc',
    rows: '500',
  }, 10000)) as SolrGroupedResponse;

  const rawGroups = res.grouped?.merchant_key?.groups ?? [];
  return rawGroups
    .filter(g => g.groupValue)
    .map(g => ({
      merchantKey: g.groupValue as string,
      docs: g.doclist.docs.map(d => ({
        id: d.id as string,
        user_id: unwrapScalar<string>(d.user_id) ?? userId,
        transaction_id: unwrapScalar<string>(d.transaction_id) ?? '',
        connection_id: unwrapScalar<string>(d.connection_id),
        mono_connection_id: unwrapScalar<string>(d.mono_connection_id),
        raw_name: unwrapScalar<string>(d.raw_name) ?? '',
        merchant_raw: unwrapScalar<string>(d.merchant_raw) ?? '',
        merchant_key: unwrapScalar<string>(d.merchant_key) ?? (g.groupValue as string),
        canonical_name: unwrapScalar<string>(d.canonical_name) ?? '',
        category: unwrapScalar<string>(d.category) ?? 'Other',
        amount: unwrapScalar<number>(d.amount) ?? 0,
        tx_date: unwrapScalar<string>(d.tx_date) ?? '',
        is_non_subscription: unwrapScalar<boolean>(d.is_non_subscription) === true,
      })),
    }));
}

export async function deleteTransactionsByConnection(
  userId: string,
  opts: { connectionId?: string; monoConnectionId?: string }
): Promise<void> {
  const filters = [`user_id:"${escapeSolr(userId)}"`];
  if (opts.connectionId) filters.push(`connection_id:"${escapeSolr(opts.connectionId)}"`);
  if (opts.monoConnectionId) filters.push(`mono_connection_id:"${escapeSolr(opts.monoConnectionId)}"`);
  if (filters.length < 2) return;

  try {
    await solrPost(`${TRANSACTIONS_CORE}/update`, { delete: { query: filters.join(' AND ') } });
    await solrPost(`${TRANSACTIONS_CORE}/update`, { commit: {} });
  } catch (err) {
    console.warn('[Solr] deleteTransactionsByConnection failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Merchant Seed & Self-Learning Upsert
// ─────────────────────────────────────────────────────────────

export async function indexMerchants(docs: MerchantDoc[]): Promise<void> {
  const normalized = docs.map(d => ({
    ...d,
    is_non_subscription: d.is_non_subscription ?? false,
    is_category_hint: d.is_category_hint ?? false,
    source: d.source ?? 'seed',
  }));
  await solrPost(`${MERCHANTS_CORE}/update/json/docs`, normalized, 15000);
  await solrPost(`${MERCHANTS_CORE}/update`, { commit: {} }, 10000);
}

export async function clearMerchantsIndex(): Promise<void> {
  await solrPost(`${MERCHANTS_CORE}/update`, { delete: { query: '*:*' } });
  await solrPost(`${MERCHANTS_CORE}/update`, { commit: {} });
}

export async function upsertLearnedMerchant(
  name: string,
  category: string,
  defaultCycle?: string
): Promise<void> {
  if (!name || !category || category === 'Other' || category === 'BLOCKLIST') return;
  const clean = cleanDescriptorForQuery(name);
  if (!clean) return;

  const id = `learned_${clean.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  if (!id || id === 'learned_') return;

  try {
    // Do not duplicate curated seed entries or existing learned entries
    const existingMatch = await lookupMerchant(name);
    if (existingMatch && !existingMatch.is_non_subscription) return;

    await indexMerchants([
      {
        id,
        canonical_name: name.trim(),
        aliases: Array.from(new Set([name.trim().toLowerCase(), clean])),
        category,
        default_cycle: defaultCycle,
        is_non_subscription: false,
        is_category_hint: false,
        source: 'learned',
      },
    ]);
  } catch (err) {
    console.warn('[Solr] upsertLearnedMerchant failed:', err);
  }
}
