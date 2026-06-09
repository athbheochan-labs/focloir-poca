import { writable } from 'svelte/store';
import type { LookupResult } from '$lib/types';

export type SearchDirection = 'ga-en' | 'en-ga';
export type SearchStatus = 'idle' | 'loading' | 'done' | 'empty' | 'error';

export const searchQuery = writable('');
export const searchDirection = writable<SearchDirection>('ga-en');

// Populated by the lookup service; components read these, never write them.
export const searchResults = writable<LookupResult[]>([]);
export const searchStatus = writable<SearchStatus>('idle');
export const searchError = writable('');

// The entry currently open in the detail panel.
// Set automatically to the first result; can be overridden by user click.
export const activeEntry = writable<LookupResult | null>(null);
