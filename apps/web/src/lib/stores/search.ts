import { writable } from 'svelte/store';

export type SearchDirection = 'ga-en' | 'en-ga';

export const searchQuery = writable('');
export const searchDirection = writable<SearchDirection>('ga-en');
