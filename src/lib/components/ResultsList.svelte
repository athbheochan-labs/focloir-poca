<script lang="ts">
  import { cn } from '$lib/utils';
  import { searchQuery, searchResults, searchStatus, searchError, activeEntry } from '$lib/stores/search';
  import type { LookupResult } from '$lib/types';

  function firstGloss(r: LookupResult): string {
    const tDef = r.teanglann?.senses?.[0]?.definition?.trim();
    if (tDef) return tDef;
    const fMeaning = r.focloir?.senses?.[0]?.meaning?.trim();
    if (fMeaning) return fMeaning;
    return r.focloir?.senses?.[0]?.translations?.[0]?.irish?.trim() ?? '';
  }

  function posLabel(r: LookupResult): string {
    return r.teanglann?.partOfSpeech || r.focloir?.senses?.[0]?.partOfSpeech || '';
  }

  function headword(r: LookupResult): string {
    return r.teanglann?.headword || r.focloir?.headword || r.word;
  }
</script>

<div class="flex h-full flex-col">
  {#if $searchStatus === 'idle'}
    <!-- Nothing typed yet — silent -->

  {:else if $searchStatus === 'loading'}
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

  {:else if $searchStatus === 'error'}
    <div class="px-4 py-6 text-sm text-destructive" role="alert">
      <p class="font-medium">Earráid nasctha</p>
      <p class="mt-0.5 text-xs opacity-80">{$searchError}</p>
    </div>

  {:else if $searchStatus === 'empty'}
    <div class="px-4 py-8 text-center text-sm text-muted-foreground" role="status">
      <p>Focal gan aimsiú.</p>
      <p class="mt-0.5 text-xs">
        Ní bhfuarthas "<span class="italic">{$searchQuery}</span>" in Ó Dónaill ná NEID.
      </p>
    </div>

  {:else}
    <ul role="listbox" aria-label="Torthaí cuardaigh">
      {#each $searchResults as result (result.word)}
        {@const active = $activeEntry?.word === result.word}
        <li role="option" aria-selected={active}>
          <button
            type="button"
            onclick={() => activeEntry.set(result)}
            class={cn(
              'w-full border-l-2 px-4 py-3 text-left transition-colors',
              active ? 'border-primary bg-primary/8' : 'border-transparent hover:bg-muted/60',
            )}
          >
            <div class="flex items-baseline gap-2">
              <span class="font-serif text-lg italic leading-tight text-foreground">
                {headword(result)}
              </span>
              {#if posLabel(result)}
                <span class="shrink-0 rounded px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground">
                  {posLabel(result)}
                </span>
              {/if}
            </div>
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
