import { prisma } from './prisma';
import {
  getUserTransactionsGrouped,
  indexTransactions,
  inferCategoryViaSolr,
  isSolrOnline,
  lookupMerchant,
  resetSolrAvailabilityCache,
  upsertLearnedMerchant,
  type SolrMatchResult,
  type SolrTransactionDoc,
} from './solrClient';
import {
  isSimilarMerchant,
  mapWithConcurrency,
  normalizeMerchant,
  staticIsNonSubscription,
  staticResolveMerchantCategory,
  stripGatewayPrefix,
} from './merchantFallback';

export { resetSolrAvailabilityCache };

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface QuilttTransaction {
  transaction_id: string;
  merchant_name: string | null;
  name: string;
  amount: number;        // positive = debit (money out)
  date: string;          // YYYY-MM-DD
  category: string[] | null;
  pending: boolean;
}

interface ResolvedDescriptor {
  merchantKey: string;
  canonicalName: string;
  category: string;
  isBlocklisted: boolean;
  fromSolr: boolean;
}

interface NormalizedTx {
  transaction_id: string;
  raw_name: string;
  merchant_raw: string;
  merchant_key: string;
  canonical_name: string;
  category: string;
  amount: number;
  date: string;
  connection_id?: string;
  mono_connection_id?: string;
}

// ─────────────────────────────────────────────────────────────
// Descriptor resolution (Solr primary -> static fallback)
// Runs BEFORE grouping so variant descriptors like "NFLX DIGITAL"
// and "PAYPAL *NETFLIX" converge to the same canonical merchantKey.
// ─────────────────────────────────────────────────────────────

async function resolveDescriptors(
  debits: QuilttTransaction[],
  userId: string,
  useSolr: boolean
): Promise<Map<string, ResolvedDescriptor>> {
  const uniquePairs = new Map<string, { rawName: string; merchantName: string | null; rawCategory: string | null }>();

  for (const tx of debits) {
    const key = `${tx.merchant_name ?? ''}||${tx.name}`;
    if (!uniquePairs.has(key)) {
      uniquePairs.set(key, {
        rawName: tx.name,
        merchantName: tx.merchant_name,
        rawCategory: tx.category?.[0] ?? null,
      });
    }
  }

  const cache = new Map<string, ResolvedDescriptor>();
  const entries = Array.from(uniquePairs.entries());

  await mapWithConcurrency(entries, 8, async ([cacheKey, info]) => {
    const displayFallback = info.merchantName || info.rawName;

    // Fast static blocklist pre-check across both raw name and merchant_name
    if (
      staticIsNonSubscription(info.rawName) ||
      (info.merchantName && staticIsNonSubscription(info.merchantName))
    ) {
      cache.set(cacheKey, {
        merchantKey: 'blocklist',
        canonicalName: displayFallback,
        category: 'BLOCKLIST',
        isBlocklisted: true,
        fromSolr: false,
      });
      return;
    }

    if (useSolr) {
      const match: SolrMatchResult | null = await lookupMerchant(info.rawName, info.merchantName);
      if (match) {
        if (match.is_non_subscription) {
          cache.set(cacheKey, {
            merchantKey: `blocklist:${match.id}`,
            canonicalName: match.canonical_name,
            category: 'BLOCKLIST',
            isBlocklisted: true,
            fromSolr: true,
          });
          return;
        }
        cache.set(cacheKey, {
          merchantKey: `solr:${match.id}`,
          canonicalName: match.canonical_name,
          category: match.category || 'Other',
          isBlocklisted: false,
          fromSolr: true,
        });
        return;
      }

      // Unknown merchant in seed: try Solr similarity / category-hint inference
      const inferredCategory =
        (await inferCategoryViaSolr(
          `${info.merchantName ?? ''} ${info.rawName}`.trim(),
          userId
        )) ?? staticResolveMerchantCategory(displayFallback, info.rawCategory);

      const norm = normalizeMerchant(displayFallback) || displayFallback.toLowerCase();
      cache.set(cacheKey, {
        merchantKey: `norm:${norm}`,
        canonicalName: stripGatewayPrefix(displayFallback) || displayFallback,
        category: inferredCategory,
        isBlocklisted: false,
        fromSolr: false,
      });
      return;
    }

    // Solr offline fallback
    const norm = normalizeMerchant(displayFallback) || displayFallback.toLowerCase();
    cache.set(cacheKey, {
      merchantKey: `norm:${norm}`,
      canonicalName: displayFallback,
      category: staticResolveMerchantCategory(displayFallback, info.rawCategory),
      isBlocklisted: false,
      fromSolr: false,
    });
  });

  return cache;
}

// ─────────────────────────────────────────────────────────────
// Cluster transactions by amount similarity within a merchant group
// e.g. separates iCloud ($2.99) from Apple Music ($10.99)
// ─────────────────────────────────────────────────────────────

function clusterByAmount(txs: NormalizedTx[]): NormalizedTx[][] {
  const clusters: Array<{ anchorAmount: number; items: NormalizedTx[] }> = [];

  for (const tx of txs) {
    let placed = false;
    for (const c of clusters) {
      const diff = Math.abs(c.anchorAmount - tx.amount);
      if (diff / Math.max(c.anchorAmount, 1) < 0.10 || diff <= 1) {
        c.items.push(tx);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push({ anchorAmount: tx.amount, items: [tx] });
    }
  }

  return clusters.map(c => c.items);
}

/**
 * Fallback in-memory grouping when Solr `transactions` collection is unavailable.
 */
function groupInMemory(txs: NormalizedTx[]): NormalizedTx[][] {
  const groups = new Map<string, NormalizedTx[]>();

  for (const tx of txs) {
    let matchedKey: string | null = null;
    for (const [key] of groups) {
      const sepIdx = key.lastIndexOf('|');
      const keyMerchant = key.slice(0, sepIdx);
      const parsedAmount = parseFloat(key.slice(sepIdx + 1));

      const sameMerchant = isSimilarMerchant(keyMerchant, tx.merchant_key);
      const diff = Math.abs(parsedAmount - tx.amount);
      const similarAmount = diff / Math.max(parsedAmount, 1) < 0.10 || diff <= 1;

      if (sameMerchant && similarAmount) {
        matchedKey = key;
        break;
      }
    }
    if (matchedKey) {
      groups.get(matchedKey)!.push(tx);
    } else {
      groups.set(`${tx.merchant_key}|${tx.amount}`, [tx]);
    }
  }

  return Array.from(groups.values());
}

// ─────────────────────────────────────────────────────────────
// Billing cycle detection
// ─────────────────────────────────────────────────────────────

function detectCycle(gaps: number[]): 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null {
  if (gaps.length === 0) return null;
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg >= 6 && avg <= 8) return 'weekly';
  if (avg >= 28 && avg <= 35) return 'monthly';
  if (avg >= 85 && avg <= 100) return 'quarterly';
  if (avg >= 300 && avg <= 380) return 'yearly';
  return null;
}

function computeNextBillingDate(lastDate: Date, cycle: string): Date {
  const next = new Date(lastDate);
  switch (cycle) {
    case 'weekly':    next.setDate(next.getDate() + 7);    break;
    case 'monthly':   next.setMonth(next.getMonth() + 1);  break;
    case 'quarterly': next.setMonth(next.getMonth() + 3);  break;
    case 'yearly':    next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}

function toSolrDate(dateStr: string): string {
  if (dateStr.includes('T')) return new Date(dateStr).toISOString();
  return `${dateStr}T00:00:00Z`;
}

// ─────────────────────────────────────────────────────────────
// Main recurring engine — Solr-enhanced
// ─────────────────────────────────────────────────────────────

export async function runRecurringEngine(
  userId: string,
  transactions: QuilttTransaction[],
  connectionId?: string,
  monoConnectionId?: string
): Promise<{ detected: number; updated: number }> {
  const detectionSource = monoConnectionId ? 'mono' : 'quiltt';
  const useSolr = await isSolrOnline('RecurringEngine');

  // ── Step 1: Keep only settled debit transactions ──────────────────
  const debits = transactions.filter(t => !t.pending && t.amount > 0);
  if (debits.length === 0 && !useSolr) {
    return { detected: 0, updated: 0 };
  }

  // ── Step 2: Canonicalise & filter blocklisted descriptors via Solr ─
  const resolutionMap = await resolveDescriptors(debits, userId, useSolr);

  const validNormalized: NormalizedTx[] = [];
  for (const tx of debits) {
    const cacheKey = `${tx.merchant_name ?? ''}||${tx.name}`;
    const resolved = resolutionMap.get(cacheKey);
    if (!resolved || resolved.isBlocklisted) continue;

    validNormalized.push({
      transaction_id: tx.transaction_id,
      raw_name: tx.name,
      merchant_raw: tx.merchant_name || tx.name,
      merchant_key: resolved.merchantKey,
      canonical_name: resolved.canonicalName,
      category: resolved.category,
      amount: tx.amount,
      date: tx.date,
      connection_id: connectionId,
      mono_connection_id: monoConnectionId,
    });
  }

  // ── Step 3: Index into Solr & cluster via Solr Result Grouping ─────
  //   Indexing persists transactions across bank syncs so quarterly/yearly
  //   charges are still detected when only recent transactions arrive.
  let candidateClusters: NormalizedTx[][] | null = null;

  if (useSolr) {
    try {
      const solrDocs: SolrTransactionDoc[] = validNormalized.map(t => ({
        id: `${userId}::${t.transaction_id}`,
        user_id: userId,
        transaction_id: t.transaction_id,
        ...(t.connection_id ? { connection_id: t.connection_id } : {}),
        ...(t.mono_connection_id ? { mono_connection_id: t.mono_connection_id } : {}),
        raw_name: t.raw_name,
        merchant_raw: t.merchant_raw,
        merchant_key: t.merchant_key,
        canonical_name: t.canonical_name,
        category: t.category,
        amount: t.amount,
        tx_date: toSolrDate(t.date),
        is_non_subscription: false,
      }));

      if (solrDocs.length > 0) {
        await indexTransactions(solrDocs);
      }

      const grouped = await getUserTransactionsGrouped(userId);
      candidateClusters = [];
      for (const grp of grouped) {
        const mapped: NormalizedTx[] = grp.docs.map(d => ({
          transaction_id: d.transaction_id,
          raw_name: d.raw_name,
          merchant_raw: d.merchant_raw,
          merchant_key: d.merchant_key,
          canonical_name: d.canonical_name,
          category: d.category,
          amount: d.amount,
          date: d.tx_date.split('T')[0],
          connection_id: d.connection_id,
          mono_connection_id: d.mono_connection_id,
        }));
        candidateClusters.push(...clusterByAmount(mapped));
      }
    } catch (err) {
      console.warn('[RecurringEngine] Solr transaction grouping failed — using in-memory fallback:', err);
      candidateClusters = null;
    }
  }

  if (!candidateClusters) {
    candidateClusters = groupInMemory(validNormalized);
  }

  // ── Step 4: Detect recurrence patterns & persist subscriptions ─────
  let detected = 0;
  let updated = 0;

  for (const txGroup of candidateClusters) {
    if (txGroup.length < 2) continue;

    const sorted = [...txGroup].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24);
      gaps.push(Math.round(diff));
    }

    const cycle = detectCycle(gaps);
    if (!cycle) continue;

    // Amount consistency check (< 5% variance from cluster mean)
    const amounts = sorted.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (avgAmount <= 0) continue;
    const allConsistent = amounts.every(
      a => Math.abs(a - avgAmount) / avgAmount < 0.05
    );
    if (!allConsistent) continue;

    const latest = sorted[sorted.length - 1];
    const canonicalName = latest.canonical_name;
    const category = latest.category || 'Other';

    // Self-learn newly discovered recurring merchants into Solr
    if (useSolr && latest.merchant_key.startsWith('norm:') && category !== 'Other') {
      upsertLearnedMerchant(canonicalName, category, cycle).catch(() => {});
    }

    const lastBillingDate = new Date(latest.date);
    const nextBillingDate = computeNextBillingDate(lastBillingDate, cycle);
    const billingCycleDay = lastBillingDate.getDate();

    // Match existing subscription by canonical name OR raw descriptor (handles pre-Solr entries)
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        OR: [
          { name: { equals: canonicalName, mode: 'insensitive' } },
          { name: { equals: latest.merchant_raw, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          price: avgAmount,
          billingCycle: cycle,
          billingCycleDay,
          lastBillingDate,
          nextBillingDate,
          transactionId: latest.transaction_id,
          // NOTE: intentionally NOT updating connectionId — the subscription
          // stays linked to whichever bank originally detected it.
        },
      });
      updated++;
    } else {
      detected++;
      await prisma.subscription.create({
        data: {
          userId,
          name: canonicalName,
          price: avgAmount,
          currency: 'USD',
          billingCycle: cycle,
          billingCycleDay,
          startDate: new Date(sorted[0].date),
          lastBillingDate,
          nextBillingDate,
          category,
          status: 'active',
          detectionSource,
          transactionId: latest.transaction_id,
          connectionId: connectionId ?? undefined,
          monoConnectionId: monoConnectionId ?? undefined,
        },
      });
    }
  }

  return { detected, updated };
}
