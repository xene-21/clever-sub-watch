/**
 * seedSolr.ts
 * Idempotent bootstrap & seed script for Apache Solr.
 *   1. Verifies Solr is reachable at SOLR_URL
 *   2. Creates `merchants` & `transactions` collections (SolrCloud or Standalone)
 *   3. Applies explicit schemas (field types, single-valued types, copyFields)
 *   4. Indexes the canonical merchant catalogue + blocklist + category hints
 *
 * Run with:  npm run seed:solr  (inside /server)
 */

import 'dotenv/config';
import { MERCHANT_SEED } from '../lib/merchantSeedData';
import {
  clearMerchantsIndex,
  ensureCollectionsAndSchemas,
  indexMerchants,
  isSolrServerReachable,
} from '../lib/solrClient';

async function main() {
  const solrUrl = process.env.SOLR_URL ?? 'http://localhost:8983/solr';
  console.log(`[SeedSolr] Checking Solr connectivity at ${solrUrl}...`);

  const online = await isSolrServerReachable();
  if (!online) {
    console.error(`[SeedSolr] ❌  Solr is not reachable at ${solrUrl}`);
    console.error('[SeedSolr] Start Solr first: C:\\Users\\xavie\\Downloads\\solr-10.1.0\\bin\\solr.cmd start -p 8983');
    process.exit(1);
  }

  console.log('[SeedSolr] ✅  Solr server reachable. Ensuring collections & schemas...');
  await ensureCollectionsAndSchemas();

  console.log('[SeedSolr] Clearing previous merchant seed entries...');
  await clearMerchantsIndex();

  console.log(`[SeedSolr] Indexing ${MERCHANT_SEED.length} merchant/blocklist/hint documents...`);
  await indexMerchants(MERCHANT_SEED);

  console.log('[SeedSolr] ✅  Done! Both `merchants` and `transactions` collections are ready.');
}

main().catch((err) => {
  console.error('[SeedSolr] Fatal error:', err);
  process.exit(1);
});
