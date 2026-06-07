import { writable } from 'svelte/store';
import type { LookupResult } from '$lib/types/proxy';

export type SearchDirection = 'ga-en' | 'en-ga';

export const searchQuery = writable('');
export const searchDirection = writable<SearchDirection>('ga-en');
export const activeEntry = writable<LookupResult | null>(null);
