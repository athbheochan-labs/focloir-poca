/**
 * lookup.ts — thin fetch layer between the search store and the proxy API.
 *
 * The proxy exposes GET /dictionary/lookup/:word (path param).
 * performLookup() writes to the shared stores; components stay read-only.
 */
import {
  searchResults,
  searchStatus,
  searchError,
  activeEntry,
} from '$lib/stores/search';
import type { LookupResult } from '$lib/types/proxy';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// One controller per in-flight request; replaced on each call so stale
// responses are automatically discarded.
let controller: AbortController | null = null;

export async function performLookup(word: string): Promise<void> {
  controller?.abort();
  controller = new AbortController();

  searchStatus.set('loading');
  searchResults.set([]);
  searchError.set('');

  try {
    const res = await fetch(
      `${API_URL}/dictionary/lookup/${encodeURIComponent(word)}`,
      { signal: controller.signal },
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as LookupResult;

    if (!data.teanglann && !data.focloir) {
      searchResults.set([]);
      searchStatus.set('empty');
      activeEntry.set(null);
    } else {
      searchResults.set([data]);
      searchStatus.set('done');
      activeEntry.set(data); // auto-select the first (and currently only) result
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return; // superseded by a newer query
    searchError.set((err as Error).message || 'Unknown error');
    searchStatus.set('error');
  }
}

export function clearSearch(): void {
  controller?.abort();
  controller = null;
  searchResults.set([]);
  searchStatus.set('idle');
  searchError.set('');
  activeEntry.set(null);
}
