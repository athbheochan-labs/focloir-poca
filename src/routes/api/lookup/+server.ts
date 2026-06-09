import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scrapeTeanglann } from '$lib/scrapers/teanglann';
import { scrapeFocloir } from '$lib/scrapers/focloir';
import type { LookupResult } from '$lib/types';

const TTL = 3_600_000; // 1 hour
const cache = new Map<string, { value: LookupResult; expiresAt: number }>();

function cacheGet(key: string): LookupResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.value;
}

function cacheSet(key: string, value: LookupResult): void {
  cache.set(key, { value, expiresAt: Date.now() + TTL });
}

export const GET: RequestHandler = async ({ url }) => {
  const word = url.searchParams.get('q')?.trim();
  if (!word) throw error(400, 'Missing query parameter: q');

  const cacheKey = `lookup:${word}`;
  const cached = cacheGet(cacheKey);
  if (cached) return json(cached);

  const [teanglannResult, focloirResult] = await Promise.allSettled([
    scrapeTeanglann(word),
    scrapeFocloir(word),
  ]);

  const errors: { source: string; message: string }[] = [];

  const teanglann = teanglannResult.status === 'fulfilled' ? teanglannResult.value : null;
  if (teanglannResult.status === 'rejected') {
    errors.push({ source: 'teanglann', message: (teanglannResult.reason as Error).message ?? 'Unknown error' });
  }

  const focloir = focloirResult.status === 'fulfilled' ? focloirResult.value : null;
  if (focloirResult.status === 'rejected') {
    errors.push({ source: 'focloir', message: (focloirResult.reason as Error).message ?? 'Unknown error' });
  }

  const result: LookupResult = { word, teanglann, focloir, errors };
  cacheSet(cacheKey, result);

  return json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
};

export const OPTIONS: RequestHandler = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
