import {
  searchResults,
  searchStatus,
  searchError,
  activeEntry,
} from '$lib/stores/search';
import type { LookupResult } from '$lib/types';

let controller: AbortController | null = null;

export async function performLookup(word: string): Promise<void> {
  controller?.abort();
  controller = new AbortController();

  searchStatus.set('loading');
  searchResults.set([]);
  searchError.set('');

  try {
    const res = await fetch(
      `/api/lookup?q=${encodeURIComponent(word)}`,
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
      activeEntry.set(data);
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
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
