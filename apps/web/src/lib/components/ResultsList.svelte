<script lang="ts">
  import { cn } from '$lib/utils';
  import { searchQuery, activeEntry } from '$lib/stores/search';
  import type { LookupResult } from '$lib/types/proxy';

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

  type Status = 'idle' | 'loading' | 'error' | 'empty' | 'done';

  let status = $state<Status>('idle');
  let results = $state<LookupResult[]>([]);
  let errorMessage = $state('');

  $effect(() => {
    const word = $searchQuery;

    if (!word.trim()) {
      status = 'idle';
      results = [];
      activeEntry.set(null);
      return;
    }

    status = 'loading';
    results = [];

    const controller = new AbortController();

    fetch(`${API_URL}/dictionary/lookup/${encodeURIComponent(word)}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<LookupResult>;
      })
      .then((data) => {
        if (!data.teanglann && !data.focloir) {
          status = 'empty';
          results = [];
          activeEntry.set(null);
        } else {
          results = [data];
          status = 'done';
          // Auto-select the single result
          activeEntry.set(data);
        }
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        errorMessage = err.message;
        status = 'error';
      });

    return () => controller.abort();
  });

  function firstGloss(r: LookupResult): string {
    const tDef = r.teanglann?.senses?.[0]?.definition?.trim();
    if (tDef) return tDef;
    const fMeaning = r.focloir?.senses?.[0]?.meaning?.trim();
    if (fMeaning) return fMeaning;
    const fTr = r.focloir?.senses?.[0]?.translations?.[0]?.irish?.trim();
    return fTr ?? '';
  }

  function posLabel(r: LookupResult): string {
    return r.teanglann?.partOfSpeech || r.focloir?.senses?.[0]?.partOfSpeech || '';
  }

  function headword(r: LookupResult): string {
    return r.teanglann?.headword || r.focloir?.headword || r.word;
  }

  function isActive(r: LookupResult): boolean {
    return $activeEntry?.word === r.word;
  }
</script>

<div class="flex h-full flex-col">
  {#if status === 'idle'}
    <!-- Nothing typed yet — silent -->

  {:else if status === 'loading'}
    <!-- Skeleton -->
    <div class="space-y-px" aria-busy="true" aria-label="Loading…">
      {#each [1, 2] as _}
        <div class="animate-pulse px-4 py-3">
          <div class="mb-2 flex items-center gap-2">
            <div class="h-5 w-24 rounded bg-muted"></div>
            <div class="h-4 w-16 rounded bg-muted"></div>
          </div>
          <div class="h-4 w-3/4 rounded bg-muted"></div>
        </div>
      {/each}
    </div>

  {:else if status === 'error'}
    <div class="px-4 py-6 text-sm text-destructive" role="alert">
      <p class="font-medium">Earráid nasctha</p>
      <p class="mt-0.5 text-xs opacity-80">{errorMessage}</p>
    </div>

  {:else if status === 'empty'}
    <div class="px-4 py-8 text-center text-sm text-muted-foreground" role="status">
      <p>Focal gan aimsiú.</p>
      <p class="mt-0.5 text-xs">Ní bhfuarthas "<span class="italic">{$searchQuery}</span>" in Ó Dónaill ná NEID.</p>
    </div>

  {:else}
    <!-- Results -->
    <ul role="listbox" aria-label="Torthaí cuardaigh">
      {#each results as result (result.word)}
        {@const active = isActive(result)}
        <li role="option" aria-selected={active}>
          <button
            type="button"
            onclick={() => activeEntry.set(result)}
            class={cn(
              'w-full border-l-2 px-4 py-3 text-left transition-colors',
              active
                ? 'border-primary bg-primary/8 '
                : 'border-transparent hover:bg-muted/60',
            )}
          >
            <!-- Headword + POS -->
            <div class="flex items-baseline gap-2">
              <span
                class={cn(
                  'font-serif text-lg italic leading-tight',
                  active ? 'text-foreground' : 'text-foreground',
                )}
              >
                {headword(result)}
              </span>
              {#if posLabel(result)}
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground"
                >
                  {posLabel(result)}
                </span>
              {/if}
            </div>
            <!-- First gloss -->
            {#if firstGloss(result)}
              <p class="mt-0.5 truncate text-sm text-muted-foreground">
                {firstGloss(result)}
              </p>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
